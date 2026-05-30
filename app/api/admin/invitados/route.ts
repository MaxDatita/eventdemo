import { NextResponse } from 'next/server';
import {
  createAdminInvitado,
  deleteAdminInvitado,
  listAdminInvitados,
  updateAdminInvitado,
} from '@/lib/google-sheets-invitados';
import { invalidateInvitadosCache } from '@/lib/invitados-cache';
import { isAdminGuestsSessionValid } from '@/lib/admin-guests-auth';
import { applyRateLimit } from '@/lib/rate-limit';

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function isValidName(value: unknown) {
  if (typeof value !== 'string') return false;
  const normalized = normalizeText(value);
  return normalized.length >= 2 && normalized.length <= 120;
}

function parseCompanions(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 20) {
    return null;
  }
  return parsed;
}

function parseMesa(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = normalizeText(String(value));
  if (!normalized || normalized.length > 50) return null;
  return normalized;
}

function ensureAdminSession(request: Request) {
  if (!isAdminGuestsSessionValid(request)) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return null;
}

function parseRowNumber(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2) {
    return null;
  }
  return parsed;
}

export async function GET(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  try {
    const invitados = await listAdminInvitados();
    return NextResponse.json({ invitados, total: invitados.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener invitados';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  const rateLimit = applyRateLimit(request, {
    name: 'admin-guests-create',
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas altas en poco tiempo. Esperá un momento e intentá otra vez.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const nombre = typeof body?.nombre === 'string' ? normalizeText(body.nombre) : '';
    const acompanantes = parseCompanions(body?.acompanantes);
    const mesa = parseMesa(body?.mesa);

    if (!isValidName(nombre)) {
      return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });
    }

    if (
      body?.acompanantes !== '' &&
      body?.acompanantes !== null &&
      body?.acompanantes !== undefined &&
      acompanantes === null
    ) {
      return NextResponse.json({ error: 'Cantidad de acompañantes inválida' }, { status: 400 });
    }

    if (
      body?.mesa !== '' &&
      body?.mesa !== null &&
      body?.mesa !== undefined &&
      mesa === null
    ) {
      return NextResponse.json({ error: 'Mesa inválida' }, { status: 400 });
    }

    const invitado = await createAdminInvitado({
      nombre,
      acompanantes,
      mesa,
    });

    invalidateInvitadosCache();

    return NextResponse.json({ success: true, invitado }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear invitado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  const rateLimit = applyRateLimit(request, {
    name: 'admin-guests-update',
    limit: 40,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas actualizaciones en poco tiempo. Esperá un momento e intentá otra vez.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const rowNumber = parseRowNumber(body?.rowNumber);
    const nombre = typeof body?.nombre === 'string' ? normalizeText(body.nombre) : '';
    const acompanantes = parseCompanions(body?.acompanantes);
    const mesa = parseMesa(body?.mesa);

    if (rowNumber === null) {
      return NextResponse.json({ error: 'Invitado inválido' }, { status: 400 });
    }

    if (!isValidName(nombre)) {
      return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });
    }

    if (
      body?.acompanantes !== '' &&
      body?.acompanantes !== null &&
      body?.acompanantes !== undefined &&
      acompanantes === null
    ) {
      return NextResponse.json({ error: 'Cantidad de acompañantes inválida' }, { status: 400 });
    }

    if (
      body?.mesa !== '' &&
      body?.mesa !== null &&
      body?.mesa !== undefined &&
      mesa === null
    ) {
      return NextResponse.json({ error: 'Mesa inválida' }, { status: 400 });
    }

    const invitado = await updateAdminInvitado(rowNumber, {
      nombre,
      acompanantes,
      mesa,
    });

    invalidateInvitadosCache();

    return NextResponse.json({ success: true, invitado });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar invitado';
    const status = message === 'Invitado no encontrado' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  const rateLimit = applyRateLimit(request, {
    name: 'admin-guests-delete',
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas eliminaciones en poco tiempo. Esperá un momento e intentá otra vez.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const rowNumber = parseRowNumber(body?.rowNumber);

    if (rowNumber === null) {
      return NextResponse.json({ error: 'Invitado inválido' }, { status: 400 });
    }

    const invitado = await deleteAdminInvitado(rowNumber);
    invalidateInvitadosCache();

    return NextResponse.json({ success: true, invitado });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar invitado';
    const status = message === 'Invitado no encontrado' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
