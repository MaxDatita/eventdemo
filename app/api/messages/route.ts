import { getMessages } from '@/lib/google-sheets-registros';
import {
  formatModerationScoreForSheet,
  getMessageModerationThreshold,
  isMessageModerationEnabled,
  moderateMessageWithOpenAI,
  resolveModerationDecision,
} from '@/lib/message-moderation';
import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { applyRateLimit, getRateLimitClientIp } from '@/lib/rate-limit';
import { logError, logWarn } from '@/lib/server-log';

const MAX_MESSAGES_PAGE_SIZE = 50;
const MAX_MESSAGE_NAME_LENGTH = 60;
const MAX_MESSAGE_BODY_LENGTH = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const requestedPageSize = parseInt(searchParams.get('pageSize') || '20');
  const pageSize = Math.min(
    Math.max(Number.isFinite(requestedPageSize) ? requestedPageSize : 20, 1),
    MAX_MESSAGES_PAGE_SIZE
  );
  const random = searchParams.get('random') === 'true';
  const statusParam = (searchParams.get('status') || 'approved').toLowerCase();
  const status: 'approved' | 'pending' | 'rejected' | 'all' =
    statusParam === 'approved' || statusParam === 'pending' || statusParam === 'rejected' || statusParam === 'all'
      ? statusParam
      : 'approved';

  try {
    const result = await getMessages(page, pageSize, random, status);
    
    return NextResponse.json({
      messages: result.messages,
      hasMore: result.hasMore,
      page: page
    });
  } catch (error) {
    logError('messages_fetch_error');
    return NextResponse.json(
      { error: 'Error al obtener los mensajes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getRateLimitClientIp(request);
    const rateLimit = applyRateLimit(request, {
      name: 'messages-post',
      limit: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      logWarn('messages_rate_limited', { ip: clientIp });
      return NextResponse.json(
        { error: 'Demasiados envíos. Intentá nuevamente en un momento.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const nombre = String(body.nombre || '').trim();
    const mensaje = String(body.mensaje || '').trim();

    if (!nombre || !mensaje) {
      return NextResponse.json(
        { error: 'Nombre y mensaje son requeridos' },
        { status: 400 }
      );
    }

    if (nombre.length > MAX_MESSAGE_NAME_LENGTH) {
      return NextResponse.json(
        { error: `El nombre no puede superar los ${MAX_MESSAGE_NAME_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    if (mensaje.length > MAX_MESSAGE_BODY_LENGTH) {
      return NextResponse.json(
        { error: `El mensaje no puede superar los ${MAX_MESSAGE_BODY_LENGTH} caracteres` },
        { status: 400 }
      );
    }
    
    const jwt = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByTitle['Mensajes'];
    if (!sheet) {
      throw new Error('No se encontró la hoja "Mensajes"');
    }

    const rows = await sheet.getRows();
    const nextId = rows.reduce((max, row) => {
      const current = Number(row.get('id'));
      if (Number.isFinite(current)) {
        return Math.max(max, current);
      }
      return max;
    }, 0) + 1;
    const now = new Date();
    const datePart = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Salta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now);
    const timePart = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Salta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);
    const formattedDate = `${datePart} ${timePart}`;
    let estado: 'pending' | 'approved' | 'rejected' = 'pending';
    let moderationScore = '';
    let moderationReason = '';
    let moderationMode: 'sync' | 'fallback-pending' | 'disabled' = 'disabled';

    if (isMessageModerationEnabled()) {
      try {
        const result = await moderateMessageWithOpenAI(nombre, mensaje);
        const resolved = resolveModerationDecision(result, getMessageModerationThreshold());
        estado = resolved.decision;
        moderationScore = formatModerationScoreForSheet(resolved.score);
        moderationReason = resolved.reason;
        moderationMode = 'sync';
      } catch (error) {
        logWarn('messages_moderation_fallback', {
          ip: clientIp,
          reason: error instanceof Error ? error.message : 'unknown',
        });
        moderationMode = 'fallback-pending';
      }
    }

    const headers = new Set(sheet.headerValues || []);
    const rowToInsert: Record<string, string | number> = {
      id: nextId,
      Fecha: formattedDate,
      Nombre: nombre,
      Mensaje: mensaje,
      Estado: estado,
      moderation_score: moderationScore,
    };

    if (headers.has('moderation_reason')) {
      rowToInsert.moderation_reason = moderationReason;
    }
    
    await sheet.addRow(
      rowToInsert,
      { raw: false }
    );

    return NextResponse.json({
      success: true,
      id: nextId,
      estado,
      moderationMode,
    });
  } catch (error) {
    logError('messages_submit_error', {
      ip: getRateLimitClientIp(request),
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json(
      { error: 'Error al guardar el mensaje' }, 
      { status: 500 }
    );
  }
} 
