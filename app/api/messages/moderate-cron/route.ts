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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isMessageModerationEnabled()) {
      return NextResponse.json({
        ok: true,
        enabled: false,
        processed: 0,
        approved: 0,
        rejected: 0,
      });
    }

    const batchSize = Number(process.env.MESSAGE_MODERATION_BATCH_SIZE || '25');
    const threshold = getMessageModerationThreshold();

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
    const headers = new Set(sheet.headerValues || []);
    const pendingRows = rows
      .filter((row) => (row.get('Estado') || '').toString().trim().toLowerCase() === 'pending')
      .slice(0, Math.max(1, batchSize));

    let approved = 0;
    let rejected = 0;

    for (const row of pendingRows) {
      const nombre = (row.get('Nombre') || '').toString().trim();
      const mensaje = (row.get('Mensaje') || '').toString().trim();

      if (!mensaje) {
        row.set('Estado', 'rejected');
        row.set('moderation_score', formatModerationScoreForSheet(1));
        if (headers.has('moderation_reason')) {
          row.set('moderation_reason', 'Mensaje vacío');
        }
        await row.save();
        rejected += 1;
        continue;
      }

      const result = await moderateMessageWithOpenAI(nombre, mensaje);
      const resolved = resolveModerationDecision(result, threshold);

      row.set('Estado', resolved.decision);
      row.set('moderation_score', formatModerationScoreForSheet(resolved.score));
      if (headers.has('moderation_reason')) {
        row.set('moderation_reason', resolved.reason);
      }
      await row.save();

      if (resolved.decision === 'approved') {
        approved += 1;
      } else {
        rejected += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      enabled: true,
      processed: pendingRows.length,
      approved,
      rejected,
      threshold,
    });
  } catch (error) {
    console.error('Error moderating pending messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
