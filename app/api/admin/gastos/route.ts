import { NextResponse } from 'next/server';
import { isAdminGuestsSessionValid } from '@/lib/admin-guests-auth';
import { applyRateLimit } from '@/lib/rate-limit';
import {
  createAdminExpense,
  deleteAdminExpense,
  listAdminExpenses,
  updateAdminExpense,
} from '@/lib/google-sheets-gastos';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseStatus } from '@/lib/event-expenses';

function ensureAdminSession(request: Request) {
  if (!isAdminGuestsSessionValid(request)) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return null;
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function parseRowNumber(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2) {
    return null;
  }
  return parsed;
}

function parseAmount(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Number(parsed.toFixed(2));
}

function parseCategory(value: unknown): ExpenseCategory | null {
  if (typeof value !== 'string') return null;
  return (EXPENSE_CATEGORIES.find((category) => category === value) || null) as ExpenseCategory | null;
}

function parseStatus(value: unknown): ExpenseStatus | null {
  if (value === 'pagado' || value === 'pendiente') return value;
  return null;
}

function parseOptionalText(value: unknown, maxLength: number) {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = normalizeText(String(value));
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

function validateExpensePayload(body: Record<string, unknown>) {
  const concepto = typeof body.concepto === 'string' ? normalizeText(body.concepto) : '';
  const categoria = parseCategory(body.categoria);
  const monto = parseAmount(body.monto);
  const estado = parseStatus(body.estado);
  const medioPago = parseOptionalText(body.medioPago, 80);
  const fecha = parseOptionalText(body.fecha, 40);
  const proveedor = parseOptionalText(body.proveedor, 120);
  const notas = parseOptionalText(body.notas, 500);

  if (concepto.length < 2 || concepto.length > 160) {
    return { error: 'Concepto inválido' } as const;
  }

  if (!categoria) {
    return { error: 'Categoría inválida' } as const;
  }

  if (monto === null) {
    return { error: 'Monto inválido' } as const;
  }

  if (!estado) {
    return { error: 'Estado inválido' } as const;
  }

  if (body.medioPago !== '' && body.medioPago !== null && body.medioPago !== undefined && medioPago === null) {
    return { error: 'Medio de pago inválido' } as const;
  }

  if (body.fecha !== '' && body.fecha !== null && body.fecha !== undefined && fecha === null) {
    return { error: 'Fecha inválida' } as const;
  }

  if (body.proveedor !== '' && body.proveedor !== null && body.proveedor !== undefined && proveedor === null) {
    return { error: 'Proveedor inválido' } as const;
  }

  if (body.notas !== '' && body.notas !== null && body.notas !== undefined && notas === null) {
    return { error: 'Notas inválidas' } as const;
  }

  return {
    value: {
      concepto,
      categoria,
      monto,
      estado,
      medioPago,
      fecha,
      proveedor,
      notas,
    },
  } as const;
}

export async function GET(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  try {
    const gastos = await listAdminExpenses();
    return NextResponse.json({ gastos, total: gastos.length, categories: EXPENSE_CATEGORIES });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener gastos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  const rateLimit = applyRateLimit(request, {
    name: 'admin-expenses-create',
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados movimientos en poco tiempo. Esperá un momento e intentá otra vez.' },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = validateExpensePayload(body);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const gasto = await createAdminExpense(result.value);
    return NextResponse.json({ success: true, gasto }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear gasto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rowNumber = parseRowNumber(body.rowNumber);
    const result = validateExpensePayload(body);

    if (rowNumber === null) {
      return NextResponse.json({ error: 'Gasto inválido' }, { status: 400 });
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const gasto = await updateAdminExpense(rowNumber, result.value);
    return NextResponse.json({ success: true, gasto });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar gasto';
    const status = message === 'Gasto no encontrado' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rowNumber = parseRowNumber(body.rowNumber);

    if (rowNumber === null) {
      return NextResponse.json({ error: 'Gasto inválido' }, { status: 400 });
    }

    const gasto = await deleteAdminExpense(rowNumber);
    return NextResponse.json({ success: true, gasto });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar gasto';
    const status = message === 'Gasto no encontrado' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

