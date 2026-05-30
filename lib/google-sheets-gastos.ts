import { GoogleSpreadsheet, type GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import {
  EXPENSE_CATEGORIES,
  type AdminExpenseRecord,
  type ExpenseCategory,
  type ExpenseStatus,
  type ExpensesConfig,
} from '@/lib/event-expenses';

const GASTOS_SHEET_NAME = 'Gastos';
const CONFIG_SHEET_NAME = 'Configuracion';
const GASTOS_HEADERS = [
  'ID',
  'Concepto',
  'Categoria',
  'Monto',
  'Medio de Pago',
  'Fecha',
  'Proveedor',
  'Notas',
  'Estado',
  'Created At',
  'Updated At',
];
const CONFIG_HEADERS = ['Clave', 'Valor'];

function getJwtClient() {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.split(String.raw`\n`).join('\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSpreadsheet() {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, getJwtClient());
  await doc.loadInfo();
  return doc;
}

async function ensureSheet(
  doc: GoogleSpreadsheet,
  title: string,
  headers: string[]
): Promise<GoogleSpreadsheetWorksheet> {
  let sheet = doc.sheetsByTitle[title];
  if (!sheet) {
    sheet = await doc.addSheet({
      title,
      headerValues: headers,
    });
    return sheet;
  }

  await sheet.loadHeaderRow();
  const currentHeaders = sheet.headerValues.filter(Boolean);

  if (headers.every((header) => currentHeaders.includes(header))) {
    return sheet;
  }

  await sheet.setHeaderRow(headers);
  return sheet;
}

async function getGastosSheet() {
  const doc = await getSpreadsheet();
  return ensureSheet(doc, GASTOS_SHEET_NAME, GASTOS_HEADERS);
}

async function getConfigSheet() {
  const doc = await getSpreadsheet();
  return ensureSheet(doc, CONFIG_SHEET_NAME, CONFIG_HEADERS);
}

function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asText(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
}

function normalizeExpenseStatus(value: unknown): ExpenseStatus {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized === 'pagado' ? 'pagado' : 'pendiente';
}

function normalizeCategory(value: unknown): ExpenseCategory {
  const text = String(value || '').trim();
  const found = EXPENSE_CATEGORIES.find((category) => category === text);
  return found || 'Otros';
}

function mapExpenseRow(row: { get: (header: string) => unknown; rowNumber?: number }): AdminExpenseRecord {
  return {
    id: String(row.get('ID') || '').trim(),
    concepto: String(row.get('Concepto') || '').trim(),
    categoria: normalizeCategory(row.get('Categoria')),
    monto: parseNumber(row.get('Monto')) || 0,
    medioPago: asText(row.get('Medio de Pago')),
    fecha: asText(row.get('Fecha')),
    proveedor: asText(row.get('Proveedor')),
    notas: asText(row.get('Notas')),
    estado: normalizeExpenseStatus(row.get('Estado')),
    createdAt: asText(row.get('Created At')),
    updatedAt: asText(row.get('Updated At')),
    rowNumber: typeof row.rowNumber === 'number' ? row.rowNumber : 0,
  };
}

function normalizeBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return ['true', '1', 'si', 'yes'].includes(normalized);
}

function nowTimestamp() {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Salta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

function generateExpenseId(existingIds: Set<string>) {
  const TOTAL_IDS = 1000000;

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const candidate = String(Math.floor(Math.random() * TOTAL_IDS)).padStart(6, '0');
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  throw new Error('No se pudo generar un ID único para el gasto');
}

export async function listAdminExpenses() {
  const sheet = await getGastosSheet();
  const rows = await sheet.getRows();

  return rows
    .map((row) => mapExpenseRow(row))
    .filter((expense) => expense.id && expense.concepto)
    .sort((a, b) => b.rowNumber - a.rowNumber);
}

export async function createAdminExpense(input: {
  concepto: string;
  categoria: ExpenseCategory;
  monto: number;
  medioPago?: string | null;
  fecha?: string | null;
  proveedor?: string | null;
  notas?: string | null;
  estado: ExpenseStatus;
}) {
  const sheet = await getGastosSheet();
  const rows = await sheet.getRows();
  const existingIds = new Set(rows.map((row) => String(row.get('ID') || '').trim()).filter(Boolean));
  const timestamp = nowTimestamp();
  const row = await sheet.addRow(
    {
      ID: generateExpenseId(existingIds),
      Concepto: input.concepto.trim(),
      Categoria: input.categoria,
      Monto: input.monto,
      'Medio de Pago': input.medioPago?.trim() || '',
      Fecha: input.fecha?.trim() || '',
      Proveedor: input.proveedor?.trim() || '',
      Notas: input.notas?.trim() || '',
      Estado: input.estado,
      'Created At': timestamp,
      'Updated At': timestamp,
    },
    { raw: false }
  );

  return mapExpenseRow(row);
}

export async function updateAdminExpense(
  rowNumber: number,
  input: {
    concepto: string;
    categoria: ExpenseCategory;
    monto: number;
    medioPago?: string | null;
    fecha?: string | null;
    proveedor?: string | null;
    notas?: string | null;
    estado: ExpenseStatus;
  }
) {
  const sheet = await getGastosSheet();
  const rows = await sheet.getRows();
  const row = rows.find((item) => item.rowNumber === rowNumber);

  if (!row) {
    throw new Error('Gasto no encontrado');
  }

  row.assign({
    Concepto: input.concepto.trim(),
    Categoria: input.categoria,
    Monto: input.monto,
    'Medio de Pago': input.medioPago?.trim() || '',
    Fecha: input.fecha?.trim() || '',
    Proveedor: input.proveedor?.trim() || '',
    Notas: input.notas?.trim() || '',
    Estado: input.estado,
    'Updated At': nowTimestamp(),
  });

  await row.save();
  return mapExpenseRow(row);
}

export async function deleteAdminExpense(rowNumber: number) {
  const sheet = await getGastosSheet();
  const rows = await sheet.getRows();
  const row = rows.find((item) => item.rowNumber === rowNumber);

  if (!row) {
    throw new Error('Gasto no encontrado');
  }

  const expense = mapExpenseRow(row);
  await row.delete();
  return expense;
}

export async function getExpensesConfig(): Promise<ExpensesConfig> {
  const sheet = await getConfigSheet();
  const rows = await sheet.getRows();

  const configEntries: Array<[string, unknown]> = rows
    .map((row): [string, unknown] => [String(row.get('Clave') || '').trim(), row.get('Valor')])
    .filter(([key]) => Boolean(key));

  const configMap = new Map<string, unknown>(
    configEntries
  );

  return {
    useBudget: normalizeBoolean(configMap.get('usar_presupuesto')),
    budgetTotal: parseNumber(configMap.get('presupuesto_total')),
  };
}

export async function updateExpensesConfig(input: ExpensesConfig) {
  const sheet = await getConfigSheet();
  const rows = await sheet.getRows();
  const entries = [
    { key: 'usar_presupuesto', value: input.useBudget ? 'TRUE' : 'FALSE' },
    { key: 'presupuesto_total', value: input.budgetTotal === null ? '' : input.budgetTotal },
  ];

  for (const entry of entries) {
    const row = rows.find((item) => String(item.get('Clave') || '').trim() === entry.key);
    if (row) {
      row.set('Valor', entry.value);
      await row.save();
    } else {
      await sheet.addRow(
        {
          Clave: entry.key,
          Valor: entry.value,
        },
        { raw: false }
      );
    }
  }

  return getExpensesConfig();
}
