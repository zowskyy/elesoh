import { pingPostgres } from '@lso/database';
import { pingRedis } from '@lso/queue';
import type { HealthResponse, LiveHealthResponse, ReadyHealthResponse } from '@lso/schemas';
import type { Context, Hono } from 'hono';
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

async function probeDependencies(c: Context<AppEnv>) {
  const postgres = await check(() => pingPostgres(c.get('pool')));
  const redis = await check(() => pingRedis(c.get('redis')));
  return { postgres, redis };
}

export function registerHealthRoutes(app: Hono<AppEnv>): void {
  app.get('/health/live', (c) => {
    const body: LiveHealthResponse = { status: 'ok', service: 'api' };
    return c.json(body, 200);
  });

  app.get('/health/ready', async (c) => {
    const dependencies = await probeDependencies(c);
    const ready =
      dependencies.postgres.status === 'ok' && dependencies.redis.status === 'ok';
    const body: ReadyHealthResponse = {
      status: ready ? 'ok' : 'error',
      service: 'api',
      dependencies,
    };
    return c.json(body, ready ? 200 : 503);
  });

  app.get('/health', async (c) => {
    const dependencies = await probeDependencies(c);
    const okCount = [dependencies.postgres.status, dependencies.redis.status].filter(
      (status) => status === 'ok',
    ).length;
    const status = okCount === 2 ? 'ok' : okCount === 0 ? 'error' : 'degraded';
    const body: HealthResponse = {
      status,
      service: 'api',
      version: '0.1.0',
      startedAt: c.get('startedAt'),
      dependencies,
    };
    return c.json(body, status === 'ok' ? 200 : 503);
  });
}
