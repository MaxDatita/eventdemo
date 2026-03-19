import { NextResponse } from 'next/server';
import { listInvitados } from '@/lib/google-sheets-invitados';
import {
  getCachedInvitados,
  getInvitadosInFlightRequest,
  isInvitadosCacheFresh,
  setCachedInvitados,
  setInvitadosInFlightRequest,
} from '@/lib/invitados-cache';
import { isInvitadosPasswordValid } from '@/lib/invitados-auth';

function normalizeQuery(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function filterInvitados(
  invitados: Awaited<ReturnType<typeof listInvitados>>,
  query?: string
) {
  const normalizedQuery = normalizeQuery(query || '');
  if (!normalizedQuery) return invitados;

  return invitados.filter((guest) => {
    const byName = normalizeQuery(guest.nombre).includes(normalizedQuery);
    const byId = normalizeQuery(guest.id).includes(normalizedQuery);
    return byName || byId;
  });
}

export async function GET(request: Request) {
  try {
    if (!isInvitadosPasswordValid(request)) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    if (!isInvitadosCacheFresh()) {
      let inFlight = getInvitadosInFlightRequest();
      if (!inFlight) {
        inFlight = listInvitados();
        setInvitadosInFlightRequest(inFlight);
      }

      try {
        const freshInvitados = await inFlight;
        setCachedInvitados(freshInvitados);
      } finally {
        setInvitadosInFlightRequest(null);
      }
    }

    const invitados = filterInvitados(getCachedInvitados(), query);

    return NextResponse.json({
      invitados,
      total: invitados.length,
      source: 'google-sheets',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al listar invitados';
    console.error('Error en GET /api/invitados:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
