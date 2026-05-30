type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function serializeContext(context?: LogContext) {
  if (!context) return undefined;

  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined)
  );
}

function writeLog(level: LogLevel, event: string, context?: LogContext) {
  const payload = {
    event,
    ...(serializeContext(context) ? { context: serializeContext(context) } : {}),
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(payload));
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(JSON.stringify(payload));
  }
}

export function logInfo(event: string, context?: LogContext) {
  writeLog('info', event, context);
}

export function logWarn(event: string, context?: LogContext) {
  writeLog('warn', event, context);
}

export function logError(event: string, context?: LogContext) {
  writeLog('error', event, context);
}
