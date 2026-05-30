import { NextRequest, NextResponse } from 'next/server';
import {
  applyOAuthStateCookie,
  createGoogleOAuthState,
  getSafeNextPath,
} from '@/lib/demo-auth';
import { buildGoogleAuthUrl } from '@/lib/demo-auth-google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const nextPath = getSafeNextPath(request.nextUrl.searchParams.get('next'));
    const { state, token } = await createGoogleOAuthState(nextPath);
    const response = NextResponse.redirect(buildGoogleAuthUrl(state));
    applyOAuthStateCookie(response, token);
    return response;
  } catch (error) {
    console.error('Error starting Google login:', error);
    return NextResponse.redirect(new URL('/login?error=config', request.url));
  }
}
