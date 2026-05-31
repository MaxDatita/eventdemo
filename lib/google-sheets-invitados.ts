import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const INVITADOS_SHEET_NAME = 'Invitados';

type InvitadoColumnKey =
  | 'id'
  | 'nombre'
  | 'acompanantes'
  | 'mesa'
  | 'ingreso'
  | 'fechaHoraIngreso';

type InvitadoColumnMap = Record<InvitadoColumnKey, string | null>;

export interface InvitadoRecord {
  id: string;
  nombre: string;
  acompanantes: number | null;
  mesa: string | null;
  ingreso: boolean;
  fechaHoraIngreso: string | null;
}

export interface AdminInvitadoRecord extends InvitadoRecord {
  rowNumber: number;
}

export class InvitadoAlreadyCheckedInError extends Error {
  invitado: InvitadoRecord;

  constructor(invitado: InvitadoRecord) {
    super('El invitado ya fue marcado como ingresado');
    this.name = 'InvitadoAlreadyCheckedInError';
    this.invitado = invitado;
  }
}

function getJwtClient() {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.split(String.raw`\n`).join('\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getInvitadosSheet() {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, getJwtClient());
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle[INVITADOS_SHEET_NAME];
  if (!sheet) {
    throw new Error('No se encontró la hoja "Invitados"');
  }

  await sheet.loadHeaderRow();
  return sheet;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveHeader(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.find((header) => normalizedAliases.includes(normalizeHeader(header))) || null;
}

function resolveColumns(headers: string[]): InvitadoColumnMap {
  return {
    id: resolveHeader(headers, ['id', 'ID']),
    nombre: resolveHeader(headers, ['nombre', 'invitado', 'Nombre', 'Invitado']),
    acompanantes: resolveHeader(headers, [
      'acompanantes',
      'Acompanantes',
      'Acompañantes',
      'Acompañantes (opcional)',
      'Acompanantes (opcional)',
    ]),
    mesa: resolveHeader(headers, ['mesa', 'Mesa']),
    ingreso: resolveHeader(headers, ['ingreso', 'Ingreso']),
    fechaHoraIngreso: resolveHeader(headers, [
      'fecha hora ingreso',
      'Fecha y Hora',
      'fecha y hora',
      'Fecha Hora Ingreso',
      'fecha_hora_ingreso',
      'fecha ingreso',
      'hora ingreso',
    ]),
  };
}

function validateRequiredColumns(columns: InvitadoColumnMap) {
  const missing: string[] = [];
  if (!columns.id) missing.push('ID');
  if (!columns.nombre) missing.push('Nombre/Invitado');
  if (!columns.ingreso) missing.push('Ingreso');
  if (!columns.fechaHoraIngreso) missing.push('Fecha Hora Ingreso');

  if (missing.length > 0) {
    throw new Error(`Faltan columnas requeridas en "Invitados": ${missing.join(', ')}`);
  }
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return ['true', 'verdadero', 'si', 'yes', '1', 'x'].includes(normalized);
  }
  return false;
}

function parseCompanions(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
}

function normalizeAdminRowInput(input: {
  nombre: string;
  acompanantes?: number | null;
  mesa?: string | null;
}) {
  return {
    nombre: input.nombre.trim(),
    acompanantes:
      input.acompanantes === null || input.acompanantes === undefined ? null : input.acompanantes,
    mesa: input.mesa?.trim() || null,
  };
}

function collectExistingIds(
  rows: Array<{ get: (header: string) => unknown }>,
  idHeader: string
) {
  return new Set(
    rows
      .map((row) => String(row.get(idHeader) || '').trim())
      .filter(Boolean)
  );
}

function generateUniqueFourDigitId(existingIds: Set<string>) {
  const TOTAL_IDS = 10000;

  if (existingIds.size >= TOTAL_IDS) {
    throw new Error('No hay IDs disponibles para asignar');
  }

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const candidate = String(Math.floor(Math.random() * TOTAL_IDS)).padStart(4, '0');
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  for (let candidate = 0; candidate < TOTAL_IDS; candidate += 1) {
    const formatted = String(candidate).padStart(4, '0');
    if (!existingIds.has(formatted)) {
      return formatted;
    }
  }

  throw new Error('No hay IDs disponibles para asignar');
}

function mapRowToInvitado(
  row: { get: (header: string) => unknown },
  columns: InvitadoColumnMap
): InvitadoRecord {
  const id = String(row.get(columns.id!) || '').trim();
  const nombre = String(row.get(columns.nombre!) || '').trim();

  return {
    id,
    nombre,
    acompanantes: columns.acompanantes ? parseCompanions(row.get(columns.acompanantes)) : null,
    mesa: columns.mesa ? asText(row.get(columns.mesa)) : null,
    ingreso: toBoolean(row.get(columns.ingreso!)),
    fechaHoraIngreso: asText(row.get(columns.fechaHoraIngreso!)),
  };
}

function mapRowToAdminInvitado(
  row: { get: (header: string) => unknown; rowNumber?: number },
  columns: InvitadoColumnMap
): AdminInvitadoRecord {
  return {
    ...mapRowToInvitado(row, columns),
    rowNumber: typeof row.rowNumber === 'number' ? row.rowNumber : 0,
  };
}

function formatIngresoDateTime() {
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

async function updateIngresoCells(
  sheet: Awaited<ReturnType<typeof getInvitadosSheet>>,
  rowNumber: number,
  columns: InvitadoColumnMap,
  ingreso: boolean,
  fechaHoraIngreso: string
) {
  const ingresoColumnIndex = sheet.headerValues.indexOf(columns.ingreso!);
  const fechaColumnIndex = sheet.headerValues.indexOf(columns.fechaHoraIngreso!);

  if (ingresoColumnIndex < 0 || fechaColumnIndex < 0) {
    throw new Error('No se pudieron resolver las columnas de ingreso');
  }

  const rowIndex = rowNumber - 1;
  const startColumnIndex = Math.min(ingresoColumnIndex, fechaColumnIndex);
  const endColumnIndex = Math.max(ingresoColumnIndex, fechaColumnIndex) + 1;

  await sheet.loadCells({
    startRowIndex: rowIndex,
    endRowIndex: rowIndex + 1,
    startColumnIndex,
    endColumnIndex,
  });

  sheet.getCell(rowIndex, ingresoColumnIndex).value = ingreso ? 'TRUE' : 'FALSE';
  sheet.getCell(rowIndex, fechaColumnIndex).value = fechaHoraIngreso;
  await sheet.saveUpdatedCells();
}

export async function listInvitados(search?: string): Promise<InvitadoRecord[]> {
  const sheet = await getInvitadosSheet();
  const columns = resolveColumns(sheet.headerValues);
  validateRequiredColumns(columns);

  const rows = await sheet.getRows();
  const normalizedQuery = (search || '').trim().toLowerCase();

  const invitados = rows
    .map((row) => mapRowToInvitado(row, columns))
    .filter((guest) => guest.id && guest.nombre);

  if (!normalizedQuery) {
    return invitados;
  }

  return invitados.filter((guest) => {
    const byName = guest.nombre.toLowerCase().includes(normalizedQuery);
    const byId = guest.id.toLowerCase().includes(normalizedQuery);
    return byName || byId;
  });
}

export async function markIngresoById(id: string, ingreso: boolean): Promise<InvitadoRecord> {
  const sheet = await getInvitadosSheet();
  const columns = resolveColumns(sheet.headerValues);
  validateRequiredColumns(columns);

  const rows = await sheet.getRows();
  const row = rows.find((item) => String(item.get(columns.id!)).trim() === id.trim());

  if (!row) {
    throw new Error('Invitado no encontrado');
  }

  const alreadyCheckedIn = toBoolean(row.get(columns.ingreso!));
  if (ingreso && alreadyCheckedIn) {
    throw new InvitadoAlreadyCheckedInError(mapRowToInvitado(row, columns));
  }

  const fechaHoraIngreso = ingreso ? formatIngresoDateTime() : '';
  const rowNumber = typeof row.rowNumber === 'number' ? row.rowNumber : 0;

  if (!rowNumber) {
    throw new Error('No se pudo resolver la fila del invitado');
  }

  await updateIngresoCells(sheet, rowNumber, columns, ingreso, fechaHoraIngreso);

  return {
    ...mapRowToInvitado(row, columns),
    ingreso,
    fechaHoraIngreso: fechaHoraIngreso || null,
  };
}

export async function listAdminInvitados(): Promise<AdminInvitadoRecord[]> {
  const sheet = await getInvitadosSheet();
  const columns = resolveColumns(sheet.headerValues);
  validateRequiredColumns(columns);

  const rows = await sheet.getRows();

  return rows
    .map((row) => mapRowToAdminInvitado(row, columns))
    .filter((guest) => guest.nombre)
    .sort((a, b) => b.rowNumber - a.rowNumber);
}

export async function createAdminInvitado(input: {
  nombre: string;
  acompanantes?: number | null;
  mesa?: string | null;
}) {
  const sheet = await getInvitadosSheet();
  const columns = resolveColumns(sheet.headerValues);
  validateRequiredColumns(columns);
  const normalizedInput = normalizeAdminRowInput(input);
  const rows = await sheet.getRows();
  const nextId = generateUniqueFourDigitId(collectExistingIds(rows, columns.id!));

  const payload: Record<string, string | number> = {
    [columns.id!]: nextId,
    [columns.nombre!]: normalizedInput.nombre,
    [columns.ingreso!]: 'FALSE',
    [columns.fechaHoraIngreso!]: '',
  };

  if (columns.acompanantes) {
    payload[columns.acompanantes] =
      normalizedInput.acompanantes === null ? '' : normalizedInput.acompanantes;
  }

  if (columns.mesa) {
    payload[columns.mesa] = normalizedInput.mesa || '';
  }

  const row = await sheet.addRow(payload, { raw: false });
  return mapRowToAdminInvitado(row, columns);
}

export async function updateAdminInvitado(
  rowNumber: number,
  input: {
    nombre: string;
    acompanantes?: number | null;
    mesa?: string | null;
  }
) {
  const sheet = await getInvitadosSheet();
  const columns = resolveColumns(sheet.headerValues);
  validateRequiredColumns(columns);
  const normalizedInput = normalizeAdminRowInput(input);
  const rows = await sheet.getRows();
  const row = rows.find((item) => item.rowNumber === rowNumber);

  if (!row) {
    throw new Error('Invitado no encontrado');
  }

  row.set(columns.nombre!, normalizedInput.nombre);

  if (columns.acompanantes) {
    row.set(columns.acompanantes, normalizedInput.acompanantes === null ? '' : normalizedInput.acompanantes);
  }

  if (columns.mesa) {
    row.set(columns.mesa, normalizedInput.mesa || '');
  }

  await row.save();
  return mapRowToAdminInvitado(row, columns);
}

export async function deleteAdminInvitado(rowNumber: number) {
  const sheet = await getInvitadosSheet();
  const columns = resolveColumns(sheet.headerValues);
  validateRequiredColumns(columns);
  const rows = await sheet.getRows();
  const row = rows.find((item) => item.rowNumber === rowNumber);

  if (!row) {
    throw new Error('Invitado no encontrado');
  }

  const invitado = mapRowToAdminInvitado(row, columns);
  await row.delete();
  return invitado;
}
