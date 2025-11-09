import { NextRequest } from 'next/server';
import { google } from 'googleapis';

// Proxy para servir thumbnails de videos de Google Drive usando la API
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

    // Usar la API de Google Drive con Service Account para obtener el thumbnail
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Obtener thumbnail del video usando la API
    // Google Drive genera thumbnails automáticamente para videos
    const response = await drive.files.get(
      {
        fileId: fileId,
        fields: 'thumbnailLink',
        supportsAllDrives: true,
      }
    );

    // Si hay thumbnailLink, usarlo directamente
    if (response.data.thumbnailLink) {
      const thumbnailResponse = await fetch(response.data.thumbnailLink, {
        headers: {
          'user-agent': 'NextJS-Thumbnail-Proxy',
        },
        credentials: 'omit',
      });

      if (thumbnailResponse.ok && thumbnailResponse.body) {
        const contentType = thumbnailResponse.headers.get('content-type') || 'image/jpeg';
        return new Response(thumbnailResponse.body, {
          status: 200,
          headers: {
            'content-type': contentType,
            'cache-control': 'public, max-age=3600, must-revalidate',
            'access-control-allow-origin': '*',
          },
        });
      }
    }

    // Si no hay thumbnailLink, intentar generar uno usando la URL de thumbnail de Google Drive
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800-h600`;
    const thumbnailResponse = await fetch(thumbnailUrl, {
      headers: {
        'user-agent': 'NextJS-Thumbnail-Proxy',
        'referer': 'https://drive.google.com/',
      },
      credentials: 'omit',
      redirect: 'follow',
    });

    if (thumbnailResponse.ok && thumbnailResponse.body) {
      const contentType = thumbnailResponse.headers.get('content-type') || 'image/jpeg';
      return new Response(thumbnailResponse.body, {
        status: 200,
        headers: {
          'content-type': contentType,
          'cache-control': 'public, max-age=3600, must-revalidate',
          'access-control-allow-origin': '*',
        },
      });
    }

    // Si todo falla, retornar error
    return new Response('No se pudo obtener el thumbnail del video', { status: 502 });

  } catch (error) {
    console.error('Error en el proxy de thumbnail:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor al obtener el thumbnail',
        details: error instanceof Error ? error.message : String(error)
      }), 
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}

