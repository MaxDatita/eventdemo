import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { readFile } from 'fs/promises';
import path from 'path';

type ModerationResult = {
  decision: 'approved' | 'rejected';
  score: number;
  reason: string;
};

type ModerationExample = {
  nombre: string;
  mensaje: string;
  expected: ModerationResult;
};

function normalizeScore(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
}

function parseModerationResponse(raw: string): ModerationResult {
  const trimmed = raw.trim();

  try {
    const parsed = JSON.parse(trimmed) as Partial<ModerationResult>;
    const decision = parsed.decision === 'rejected' ? 'rejected' : 'approved';
    return {
      decision,
      score: normalizeScore(parsed.score),
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    };
  } catch {
    // Try to recover when the model adds extra text around JSON
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonPart = trimmed.slice(start, end + 1);
      const parsed = JSON.parse(jsonPart) as Partial<ModerationResult>;
      const decision = parsed.decision === 'rejected' ? 'rejected' : 'approved';
      return {
        decision,
        score: normalizeScore(parsed.score),
        reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      };
    }
  }

  return { decision: 'approved', score: 0, reason: 'No se pudo parsear respuesta de moderación' };
}

async function moderateTextWithOpenAI(nombre: string, mensaje: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no configurado');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const instructions = await loadModerationInstructions();
  const examples = await loadModerationExamples();
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_output_tokens: 120,
      input: [
        {
          role: 'system',
          content: instructions,
        },
        {
          role: 'system',
          content: `Ejemplos de clasificación (few-shot):\n${buildExamplesPrompt(examples)}`,
        },
        {
          role: 'user',
          content: `Nombre: ${nombre}\nMensaje: ${mensaje}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error OpenAI ${response.status}: ${errorBody}`);
  }

  const payload = await response.json() as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };
  const outputText = extractOutputText(payload);
  return parseModerationResponse(outputText);
}

function extractOutputText(payload: {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}): string {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }

  const chunks: string[] = [];
  for (const item of payload.output || []) {
    for (const part of item.content || []) {
      if (part.type === 'output_text' || part.type === 'text') {
        if (typeof part.text === 'string' && part.text.trim()) {
          chunks.push(part.text);
        }
      }
    }
  }

  return chunks.join('\n').trim();
}

async function loadModerationInstructions(): Promise<string> {
  const instructionsPath = path.join(process.cwd(), 'config', 'ai', 'message-moderation-instructions.txt');
  try {
    const content = await readFile(instructionsPath, 'utf8');
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('El archivo de instrucciones está vacío');
    }
    return trimmed;
  } catch (error) {
    console.warn('No se pudieron cargar instrucciones de moderación desde archivo. Usando fallback.', error);
    return 'Moderá mensajes de evento social y devolvé SOLO JSON minificado: {"decision":"approved|rejected","score":0.0,"reason":"motivo breve"}';
  }
}

async function loadModerationExamples(): Promise<ModerationExample[]> {
  const examplesPath = path.join(process.cwd(), 'config', 'ai', 'message-moderation-examples.json');
  try {
    const content = await readFile(examplesPath, 'utf8');
    const parsed = JSON.parse(content) as ModerationExample[];
    if (!Array.isArray(parsed)) {
      throw new Error('Formato inválido: se esperaba un array');
    }
    return parsed
      .filter((item) =>
        item &&
        typeof item.nombre === 'string' &&
        typeof item.mensaje === 'string' &&
        item.expected &&
        (item.expected.decision === 'approved' || item.expected.decision === 'rejected')
      )
      .slice(0, 20);
  } catch (error) {
    console.warn('No se pudieron cargar ejemplos de moderación. Se continúa sin few-shot.', error);
    return [];
  }
}

function buildExamplesPrompt(examples: ModerationExample[]): string {
  if (!examples.length) {
    return 'Sin ejemplos cargados.';
  }

  return examples
    .map((example, idx) => {
      const score = normalizeScore(example.expected.score).toFixed(2);
      return [
        `Ejemplo ${idx + 1}:`,
        `Nombre: ${example.nombre}`,
        `Mensaje: ${example.mensaje}`,
        `Salida esperada: {"decision":"${example.expected.decision}","score":${score},"reason":"${example.expected.reason}"}`,
      ].join('\n');
    })
    .join('\n\n');
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moderationEnabled = process.env.MESSAGE_MODERATION_ENABLED === 'true';
    if (!moderationEnabled) {
      return NextResponse.json({
        ok: true,
        enabled: false,
        processed: 0,
        approved: 0,
        rejected: 0,
      });
    }

    const threshold = Number(process.env.MESSAGE_MODERATION_THRESHOLD || '0.70');
    const batchSize = Number(process.env.MESSAGE_MODERATION_BATCH_SIZE || '25');

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
    const pendingRows = rows
      .filter((row) => (row.get('Estado') || '').toString().trim().toLowerCase() === 'pending')
      .slice(0, Math.max(1, batchSize));

    const headers = new Set(sheet.headerValues || []);
    let approved = 0;
    let rejected = 0;

    for (const row of pendingRows) {
      const nombre = (row.get('Nombre') || '').toString().trim();
      const mensaje = (row.get('Mensaje') || '').toString().trim();

      if (!mensaje) {
        row.set('Estado', 'rejected');
        row.set('moderation_score', '1');
        if (headers.has('moderation_reason')) {
          row.set('moderation_reason', 'Mensaje vacío');
        }
        await row.save();
        rejected += 1;
        continue;
      }

      const aiResult = await moderateTextWithOpenAI(nombre, mensaje);
      const score = normalizeScore(aiResult.score);
      const decision = score >= threshold ? 'rejected' : aiResult.decision;
      const scoreForSheet = score.toFixed(4).replace('.', ',');

      row.set('Estado', decision);
      row.set('moderation_score', scoreForSheet);
      if (headers.has('moderation_reason')) {
        row.set('moderation_reason', aiResult.reason || '');
      }
      await row.save();

      if (decision === 'approved') {
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
