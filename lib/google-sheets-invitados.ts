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
    throw new Error('El invitado ya fue marcado como ingresado');
  }

  row.set(columns.ingreso!, ingreso ? 'TRUE' : 'FALSE');

  if (ingreso) {
    const now = new Date();
    const fechaHora = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Salta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);

    row.set(columns.fechaHoraIngreso!, fechaHora);
  } else {
    row.set(columns.fechaHoraIngreso!, '');
  }

  await row.save();
  return mapRowToInvitado(row, columns);
}
