import { NextResponse } from 'next/server';
import {
  createInvitadosSessionToken,
  getInvitadosPassword,
  getInvitadosSessionCookieName,
  getInvitadosSessionMaxAge,
  isInvitadosSessionValid,
} from '@/lib/invitados-auth';

function buildExpiredSessionResponse() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: getInvitadosSessionCookieName(),
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
  if (!isInvitadosSessionValid(request)) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (typeof password !== 'string') {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });
    }

    if (password !== getInvitadosPassword()) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: getInvitadosSessionCookieName(),
      value: createInvitadosSessionToken(),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: getInvitadosSessionMaxAge(),
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE() {
  return buildExpiredSessionResponse();
}
