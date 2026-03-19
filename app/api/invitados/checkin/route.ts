import { NextResponse } from 'next/server';
import { markIngresoById } from '@/lib/google-sheets-invitados';
import { invalidateInvitadosCache } from '@/lib/invitados-cache';
import { isInvitadosPasswordValid } from '@/lib/invitados-auth';

export async function POST(request: Request) {
  try {
    if (!isInvitadosPasswordValid(request)) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const { id, ingreso } = await request.json();

    if (!id || typeof id !== 'string') {
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
    const message = error instanceof Error ? error.message : 'Error al actualizar ingreso';
    const status =
      message === 'Invitado no encontrado'
        ? 404
        : message === 'El invitado ya fue marcado como ingresado'
          ? 409
          : 500;

    console.error('Error en POST /api/invitados/checkin:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
