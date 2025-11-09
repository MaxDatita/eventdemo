import { NextRequest } from 'next/server';
import { google } from 'googleapis';

// Proxy para servir videos de Google Drive usando la API con Service Account
// Hace el archivo público temporalmente si es necesario para streaming
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return new Response(JSON.stringify({ error: 'Falta parámetro id' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Verificar que Google Drive está configurado
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      return new Response(
        JSON.stringify({ error: 'Google Drive no está configurado' }), 
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    console.log('Fetching video from Google Drive using API, fileId:', fileId);

    // Usar la API de Google Drive con Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Obtener información del archivo
    let fileInfo;
    try {
      fileInfo = await drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,webContentLink',
        supportsAllDrives: true,
      });
    } catch (error: any) {
      console.error('Error getting file info:', error.message);
      throw new Error(`No se pudo acceder al archivo: ${error.message}`);
    }

    console.log('File info:', fileInfo.data);

    const mimeType = fileInfo.data.mimeType || 'video/mp4';
    const fileSize = fileInfo.data.size ? parseInt(fileInfo.data.size) : undefined;
    
    if (!fileSize) {
      return new Response('No se pudo determinar el tamaño del video', { status: 500 });
    }

    // Intentar hacer el archivo público si no lo está (necesario para webContentLink)
    try {
      // Verificar si ya es público
      const permissions = await drive.permissions.list({
        fileId: fileId,
        supportsAllDrives: true,
      });
      
      const isPublic = permissions.data.permissions?.some(
        (p: any) => p.type === 'anyone' && p.role === 'reader'
      );
      
      if (!isPublic) {
        console.log('Making file public for streaming...');
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
          supportsAllDrives: true,
        });
        console.log('File made public successfully');
        
        // Re-obtener info para tener webContentLink
        fileInfo = await drive.files.get({
          fileId: fileId,
          fields: 'id,name,mimeType,size,webContentLink',
          supportsAllDrives: true,
        });
      }
    } catch (permError: any) {
      console.warn('Could not make file public (may already be public):', permError.message);
    }

    // Si tenemos webContentLink, usarlo directamente (más confiable para streaming)
    if (fileInfo.data.webContentLink) {
      console.log('Using webContentLink for video streaming:', fileInfo.data.webContentLink);
      const videoUrl = fileInfo.data.webContentLink;

      const rangeHeader = req.headers.get('range');
      const headers: HeadersInit = {
        'user-agent': 'NextJS-Video-Proxy',
      };

      if (rangeHeader) {
        headers['Range'] = rangeHeader;
      }

      const videoResponse = await fetch(videoUrl, {
        method: 'GET',
        headers,
        credentials: 'omit',
        redirect: 'follow',
      });

      if (videoResponse.ok && videoResponse.body) {
        const contentType = videoResponse.headers.get('content-type') || mimeType;
        const contentLength = videoResponse.headers.get('content-length');
        const contentRange = videoResponse.headers.get('content-range');
        const acceptRanges = videoResponse.headers.get('accept-ranges');

        const responseHeaders = new Headers();
        responseHeaders.set('content-type', contentType);
        if (contentLength) responseHeaders.set('content-length', contentLength);
        if (contentRange) responseHeaders.set('content-range', contentRange);
        responseHeaders.set('accept-ranges', acceptRanges || 'bytes');
        responseHeaders.set('cache-control', 'public, max-age=3600, must-revalidate');
        responseHeaders.set('access-control-allow-origin', '*');
        responseHeaders.set('access-control-allow-methods', 'GET, HEAD, OPTIONS');
        responseHeaders.set('access-control-allow-headers', 'Range');

        return new Response(videoResponse.body, {
          status: videoResponse.status,
          headers: responseHeaders,
        });
      }
    }

    // Fallback: descargar el video completo y servirlo como buffer
    // Esto es más confiable para que el navegador pueda parsear los metadatos MP4
    console.log('Using API direct download (buffer) as fallback');
    
    const rangeHeader = req.headers.get('range');
    let start = 0;
    let end = fileSize - 1;
    let status = 200;

    if (rangeHeader) {
      const ranges = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (ranges) {
        start = parseInt(ranges[1], 10);
        end = ranges[2] ? parseInt(ranges[2], 10) : fileSize - 1;
        end = Math.min(end, fileSize - 1);
        status = 206;
        console.log(`Range request: ${start}-${end} of ${fileSize}`);
      }
    }

    // Descargar el video completo como arraybuffer
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media',
        supportsAllDrives: true,
      },
      {
        responseType: 'arraybuffer',
      }
    );

    if (!response.data) {
      return new Response('No se pudo obtener el video de Google Drive', { status: 502 });
    }

    console.log('Video downloaded, size:', (response.data as ArrayBuffer).byteLength, 'bytes');

    // Convertir ArrayBuffer a Buffer
    const fullBuffer = Buffer.from(response.data as ArrayBuffer);
    
    // Si hay Range request, extraer solo la porción solicitada
    const buffer = rangeHeader 
      ? fullBuffer.slice(start, end + 1)
      : fullBuffer;
    
    // Crear un ReadableStream desde el buffer
    // Esto asegura que el navegador reciba los datos en el formato correcto
    const stream = new ReadableStream({
      start(controller) {
        // Enviar el buffer completo de una vez
        // Para videos MP4, esto es importante porque los metadatos están al inicio
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
        console.log('Video buffer sent, size:', buffer.length, 'bytes');
      },
    });

    const headers = new Headers();
    headers.set('content-type', mimeType);
    if (rangeHeader && status === 206) {
      headers.set('content-length', (end - start + 1).toString());
      headers.set('content-range', `bytes ${start}-${end}/${fileSize}`);
    } else {
      headers.set('content-length', fileSize.toString());
    }
    headers.set('accept-ranges', 'bytes');
    headers.set('cache-control', 'public, max-age=3600, must-revalidate');
    headers.set('access-control-allow-origin', '*');
    headers.set('access-control-allow-methods', 'GET, HEAD, OPTIONS');
    headers.set('access-control-allow-headers', 'Range');
    // Header importante: indicar que es un video para reproducir
    headers.set('content-disposition', `inline; filename="${fileInfo.data.name || 'video.mp4'}"`);

    console.log(`Returning video (${status}), type: ${mimeType}, size: ${buffer.length} bytes`);

    return new Response(stream, {
      status,
      headers,
    });
  } catch (error) {
    console.error('Error en el proxy de video:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor al procesar el video',
        details: error instanceof Error ? error.message : String(error)
      }), 
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}

