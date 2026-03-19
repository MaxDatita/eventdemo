import { NextRequest, NextResponse } from 'next/server';
import {
  createGoogleOAuthClient,
  GOOGLE_DRIVE_OAUTH_SCOPES,
  resolveGoogleOAuthRedirectUri,
} from '@/lib/google-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const preferredRedirect = request.nextUrl.searchParams.get('redirect');
    const redirectUri = resolveGoogleOAuthRedirectUri(preferredRedirect);
    const client = createGoogleOAuthClient(redirectUri);

    const state = Buffer.from(JSON.stringify({ redirectUri }), 'utf8').toString('base64url');

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: GOOGLE_DRIVE_OAUTH_SCOPES,
      state,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'No se pudo generar URL de OAuth',
      },
      { status: 500 }
    );
  }
}
