import { NextResponse } from 'next/server';
import {
  createAdminGuestsSessionToken,
  getAdminGuestsPassword,
  getAdminGuestsSessionCookieName,
  getAdminGuestsSessionMaxAge,
  isAdminGuestsSessionValid,
} from '@/lib/admin-guests-auth';
import { applyRateLimit, getRateLimitClientIp } from '@/lib/rate-limit';
import { logError, logWarn } from '@/lib/server-log';

function buildExpiredSessionResponse() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: getAdminGuestsSessionCookieName(),
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  if (!isAdminGuestsSessionValid(request)) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  try {
    const clientIp = getRateLimitClientIp(request);
    const rateLimit = applyRateLimit(request, {
      name: 'admin-guests-auth',
      limit: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      logWarn('admin_guests_auth_rate_limited', { ip: clientIp });
      return NextResponse.json(
        { error: 'Demasiados intentos. Esperá un momento antes de volver a intentar.' },
        { status: 429 }
      );
    }

    const { password } = await request.json();
    if (typeof password !== 'string') {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });
    }

    if (password !== getAdminGuestsPassword()) {
      logWarn('admin_guests_auth_failed', { ip: clientIp });
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: getAdminGuestsSessionCookieName(),
      value: createAdminGuestsSessionToken(),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: getAdminGuestsSessionMaxAge(),
    });

    return response;
  } catch {
    logError('admin_guests_auth_error', { ip: getRateLimitClientIp(request) });
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE() {
  return buildExpiredSessionResponse();
}

