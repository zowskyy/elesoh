import { pingPostgres } from '@lso/database';
import { pingRedis } from '@lso/queue';
import type { HealthResponse } from '@lso/schemas';
import type { Hono } from 'hono';
import type { AppEnv } from '../env.js';

async function check(
  run: () => Promise<void>,
): Promise<{ status: 'ok' } | { status: 'error'; message: string }> {
  try {
    await run();
    return { status: 'ok' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return { status: 'error', message };
  }
}

export function registerHealthRoutes(app: Hono<AppEnv>): void {
  app.get('/health', async (c) => {
    const postgres = await check(() => pingPostgres(c.get('pool')));
    const redis = await check(() => pingRedis(c.get('redis')));
    const okCount = [postgres.status, redis.status].filter((status) => status === 'ok').length;
    const status = okCount === 2 ? 'ok' : okCount === 0 ? 'error' : 'degraded';
    const body: HealthResponse = {
      status,
      service: 'api',
      version: '0.1.0',
      startedAt: c.get('startedAt'),
      dependencies: { postgres, redis },
    };
    return c.json(body, status === 'ok' ? 200 : 503);
  });
}
