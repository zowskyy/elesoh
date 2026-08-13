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

export type { Logger };
