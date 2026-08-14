import { loadEnv, parseEnv, type Env } from '@lso/config';

export function testEnv(): Env {
  return parseEnv({
    ...process.env,
    NODE_ENV: 'test',
    LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'silent',
  });
}

/** Prefer testEnv(); kept for callers that already use loadEnv semantics. */
export function loadTestEnv(): Env {
  process.env['NODE_ENV'] = 'test';
  if (process.env['LOG_LEVEL'] === undefined) {
    process.env['LOG_LEVEL'] = 'silent';
  }
  return loadEnv();
}
