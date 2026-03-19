import { readFile } from 'fs/promises';
import path from 'path';

export type ModerationResult = {
  decision: 'approved' | 'rejected';
  score: number;
  reason: string;
};

type ModerationExample = {
  nombre: string;
  mensaje: string;
  expected: ModerationResult;
};

export function normalizeModerationScore(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
}

export function resolveModerationDecision(result: ModerationResult, threshold: number) {
  const score = normalizeModerationScore(result.score);
  const decision = score >= threshold ? 'rejected' : result.decision;

  return {
    decision,
    score,
    reason: result.reason || '',
  };
}

export function isMessageModerationEnabled() {
  return process.env.MESSAGE_MODERATION_ENABLED === 'true';
}

export function getMessageModerationThreshold() {
  return Number(process.env.MESSAGE_MODERATION_THRESHOLD || '0.70');
}

export function formatModerationScoreForSheet(score: number) {
  return normalizeModerationScore(score).toFixed(4).replace('.', ',');
}

function parseModerationResponse(raw: string): ModerationResult {
  const trimmed = raw.trim();

  try {
    const parsed = JSON.parse(trimmed) as Partial<ModerationResult>;
    return {
      decision: parsed.decision === 'rejected' ? 'rejected' : 'approved',
      score: normalizeModerationScore(parsed.score),
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    };
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Partial<ModerationResult>;
      return {
        decision: parsed.decision === 'rejected' ? 'rejected' : 'approved',
        score: normalizeModerationScore(parsed.score),
        reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      };
    }
  }

  return {
    decision: 'approved',
    score: 0,
    reason: 'No se pudo parsear respuesta de moderación',
  };
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
      if ((part.type === 'output_text' || part.type === 'text') && typeof part.text === 'string' && part.text.trim()) {
        chunks.push(part.text);
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
      .filter(
        (item) =>
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
      const score = normalizeModerationScore(example.expected.score).toFixed(2);
      return [
        `Ejemplo ${idx + 1}:`,
        `Nombre: ${example.nombre}`,
        `Mensaje: ${example.mensaje}`,
        `Salida esperada: {"decision":"${example.expected.decision}","score":${score},"reason":"${example.expected.reason}"}`,
      ].join('\n');
    })
    .join('\n\n');
}

export async function moderateMessageWithOpenAI(nombre: string, mensaje: string): Promise<ModerationResult> {
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

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  return parseModerationResponse(extractOutputText(payload));
}
