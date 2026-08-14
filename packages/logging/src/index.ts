import { randomUUID } from 'node:crypto';
import pino, { type Logger } from 'pino';

const redactPaths = [
  'password',
  'apiKey',
  'token',
  'authorization',
  'cookie',
  'DATABASE_URL',
  'REDIS_URL',
];

export function createLogger(options: { name: string; level: string }): Logger {
  return pino({
    name: options.name,
    level: options.level,
    redact: {
      paths: redactPaths,
      censor: '[redacted]',
    },
  });
}

export function createRequestId(existing?: string | null): string {
  const trimmed = existing?.trim();
  if (trimmed !== undefined && trimmed.length > 0 && trimmed.length <= 128) {
    return trimmed;
  }
  return randomUUID();
}

export function withCorrelationId(logger: Logger, requestId: string): Logger {
  return logger.child({ requestId });
}

export type { Logger };
