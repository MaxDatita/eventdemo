import { NextRequest } from 'next/server';
import { getDriveApiClient, isGoogleDriveConfigured } from '@/lib/google-drive';

// Proxy para servir thumbnails de imagenes y videos desde Google Drive.
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
      fields: 'thumbnailLink,mimeType',
      supportsAllDrives: true,
    });

    const thumbnailUrl =
      fileMeta.data.thumbnailLink || `https://drive.google.com/thumbnail?id=${fileId}&sz=w800-h600`;

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
          'cache-control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          'access-control-allow-origin': '*',
        },
      });
    }

    return new Response('No se pudo obtener el thumbnail del archivo', { status: 502 });
  } catch (error) {
    console.error('Error en el proxy de thumbnail:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor al obtener el thumbnail',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}




