import { NextRequest } from 'next/server';
import { getDriveApiClient, isGoogleDriveConfigured } from '@/lib/google-drive';

// Proxy autenticado para servir imágenes de Google Drive.
// Esto permite ver media compartida con la cuenta OAuth aunque no sea pública.
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

    if (!isGoogleDriveConfigured()) {
      return new Response(
        JSON.stringify({ error: 'Google Drive no está configurado' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const drive = getDriveApiClient();

    const fileMeta = await drive.files.get({
      fileId,
      fields: 'id,name,mimeType,size',
      supportsAllDrives: true,
    });

    const mimeType = fileMeta.data.mimeType || 'image/jpeg';

    const response = await drive.files.get(
      {
        fileId,
        alt: 'media',
        supportsAllDrives: true,
      },
      {
        responseType: 'arraybuffer',
      }
    );

    if (!response.data) {
      return new Response('No se pudo obtener la imagen de Google Drive', { status: 502 });
    }

    const bytes = new Uint8Array(response.data as ArrayBuffer);

    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': mimeType,
        'content-length': bytes.byteLength.toString(),
        'cache-control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'content-disposition': `inline; filename="${fileMeta.data.name || 'image'}"`,
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor al obtener la imagen',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
