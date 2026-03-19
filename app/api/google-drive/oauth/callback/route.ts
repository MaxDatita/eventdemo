import { NextRequest, NextResponse } from 'next/server';
import { createGoogleOAuthClient, resolveGoogleOAuthRedirectUri } from '@/lib/google-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function decodeStateRedirectUri(state: string | null): string | null {
  if (!state) return null;

  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
      redirectUri?: string;
    };
    return parsed.redirectUri || null;
  } catch {
    return null;
  }
}

function buildHtml(payload: { refreshToken?: string; message: string; redirectUri?: string }) {
  const tokenSection = payload.refreshToken
    ? `
      <p><strong>Refresh token:</strong></p>
      <pre>${payload.refreshToken}</pre>
      <p>Copialo y pegalo en <code>GOOGLE_OAUTH_REFRESH_TOKEN</code> de tu <code>.env.local</code>.</p>
    `
    : '<p>No se recibió refresh token.</p>';

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Google Drive OAuth</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 900px; margin: 32px auto; padding: 0 16px; line-height: 1.5; }
          pre { background: #f5f5f5; padding: 12px; overflow-x: auto; border-radius: 8px; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Google Drive OAuth completado</h1>
        <p>${payload.message}</p>
        ${payload.redirectUri ? `<p><strong>Redirect URI usada:</strong> <code>${payload.redirectUri}</code></p>` : ''}
        ${tokenSection}
        <hr />
        <p>Si no vino refresh token, revocá acceso de la app en tu cuenta de Google y repetí el flujo.</p>
      </body>
    </html>
  `;
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Falta el parámetro code' }, { status: 400 });
    }

    const state = request.nextUrl.searchParams.get('state');
    const redirectFromState = decodeStateRedirectUri(state);
    const preferredRedirect = request.nextUrl.searchParams.get('redirect');
    const redirectUri = redirectFromState || resolveGoogleOAuthRedirectUri(preferredRedirect);

    const client = createGoogleOAuthClient(redirectUri);
    const { tokens } = await client.getToken(code);
    const refreshToken = tokens.refresh_token;

    const html = buildHtml({
      refreshToken: refreshToken || undefined,
      message: refreshToken
        ? 'Se obtuvo refresh token correctamente.'
        : 'Google devolvió tokens, pero sin refresh token.',
      redirectUri,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error en callback de OAuth',
      },
      { status: 500 }
    );
  }
}
