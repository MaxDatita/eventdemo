import { NextResponse } from 'next/server';
import { isAdminGuestsSessionValid } from '@/lib/admin-guests-auth';
import { getExpensesConfig, updateExpensesConfig } from '@/lib/google-sheets-gastos';

function ensureAdminSession(request: Request) {
  if (!isAdminGuestsSessionValid(request)) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return null;
}

function parseBudget(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Number(parsed.toFixed(2));
}

export async function GET(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  try {
    const config = await getExpensesConfig();
    return NextResponse.json({ config });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener configuración';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = ensureAdminSession(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const useBudget = Boolean(body.useBudget);
    const budgetTotal = parseBudget(body.budgetTotal);

    if (useBudget && budgetTotal === null) {
      return NextResponse.json({ error: 'Presupuesto inválido' }, { status: 400 });
    }

    const config = await updateExpensesConfig({
      useBudget,
      budgetTotal: useBudget ? budgetTotal : null,
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar configuración';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

