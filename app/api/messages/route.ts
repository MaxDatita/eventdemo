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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
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
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener los mensajes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nombre = String(body.nombre || '').trim();
    const mensaje = String(body.mensaje || '').trim();

    if (!nombre || !mensaje) {
      return NextResponse.json(
        { error: 'Nombre y mensaje son requeridos' },
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
        console.error('Error moderating message during submit. Guardando como pending:', error);
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
    console.error('Error en POST /api/messages:', error);
    return NextResponse.json(
      { error: 'Error al guardar el mensaje' }, 
      { status: 500 }
    );
  }
} 
