import { NextRequest } from 'next/server';

// Proxy para servir imágenes de Google Drive evitando problemas de CORS/headers
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

    const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
      fileId
    )}&export=download`;

    const upstream = await fetch(driveUrl, {
      // Importante: fuerza GET sin credenciales
      method: 'GET',
      headers: {
        // Algunos navegadores requieren un user-agent para ciertos CDNs
        'user-agent': 'NextJS-Image-Proxy',
      },
      // No enviar cookies
      credentials: 'omit',
      // Cache en el servidor también (revalidar después de 1 hora)
      next: { revalidate: 3600 },
      redirect: 'follow',
    });

    if (!upstream.ok || !upstream.body) {
      return new Response('No se pudo obtener la imagen', { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const contentLength = upstream.headers.get('content-length') || undefined;

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'content-type': contentType,
        ...(contentLength ? { 'content-length': contentLength } : {}),
        // Cache extendido para proyección: 7 días en cliente, 1 día en CDN
        // Esto asegura que las imágenes se mantengan en caché del navegador
        'cache-control': 'public, max-age=604800, s-maxage=86400, stale-while-revalidate=86400',
        // También agregar headers de caché adicionales
        'expires': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString(),
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
}


