import { NextResponse } from 'next/server';
import { InvitadoAlreadyCheckedInError, markIngresoById } from '@/lib/google-sheets-invitados';
import { invalidateInvitadosCache } from '@/lib/invitados-cache';
import { isInvitadosPasswordValid } from '@/lib/invitados-auth';
import { isSafeId } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    if (!isInvitadosPasswordValid(request)) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const { id, ingreso } = await request.json();

    if (!isSafeId(id, { minLength: 1, maxLength: 80 })) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const nextIngreso = typeof ingreso === 'boolean' ? ingreso : true;
    const invitado = await markIngresoById(id, nextIngreso);
    invalidateInvitadosCache();

    return NextResponse.json({
      success: true,
      invitado,
    });
  } catch (error) {
    if (error instanceof InvitadoAlreadyCheckedInError) {
      return NextResponse.json(
        {
          error: error.message,
          invitado: error.invitado,
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : 'Error al actualizar ingreso';
    const status =
      message === 'Invitado no encontrado'
        ? 404
        : 500;

    console.error('Error en POST /api/invitados/checkin:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
