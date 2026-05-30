import { NextRequest, NextResponse } from 'next/server';
import {
  applyDemoSessionCookie,
  clearDemoAuthCookies,
  createDemoSession,
  getOAuthStateCookieName,
  readGoogleOAuthState,
} from '@/lib/demo-auth';
import { exchangeGoogleCode } from '@/lib/demo-auth-google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const oauthCookie = request.cookies.get(getOAuthStateCookieName())?.value;

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  try {
    const oauthState = await readGoogleOAuthState(oauthCookie, state);
    if (!oauthState) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
    }

    const user = await exchangeGoogleCode(code);
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=not_allowed', request.url));
    }

    const sessionToken = await createDemoSession(user);
    const destination = new URL(oauthState.nextPath || '/', request.url);
    const response = NextResponse.redirect(destination);
    clearDemoAuthCookies(response);
    applyDemoSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error('Error finishing Google login:', error);
    const response = NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
    clearDemoAuthCookies(response);
    return response;
  }
}
