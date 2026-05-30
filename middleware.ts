import { NextRequest, NextResponse } from 'next/server';
import { getRequiredDemoRole, isDemoAuthEnabled, isDemoAuthPublicPath } from '@/config/demo-auth';
import { getDemoSessionFromRequest, isDemoUserAuthorized } from '@/lib/demo-auth';

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('next', nextPath);
  return NextResponse.redirect(loginUrl);
}

function buildUnauthorizedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('error', 'unauthorized');
  return NextResponse.redirect(redirectUrl);
}

function buildUnauthenticatedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Sesión requerida' }, { status: 401 });
  }

  return buildLoginRedirect(request);
}

export async function middleware(request: NextRequest) {
  if (!isDemoAuthEnabled()) {
    return NextResponse.next();
  }

  if (isDemoAuthPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const requiredRole = getRequiredDemoRole(request.nextUrl.pathname);
  if (!requiredRole) {
    return NextResponse.next();
  }

  const session = await getDemoSessionFromRequest(request);
  if (!session) {
    return buildUnauthenticatedResponse(request);
  }

  if (!isDemoUserAuthorized(session.role, requiredRole)) {
    return buildUnauthorizedResponse(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
