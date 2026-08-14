import { afterAll, describe, expect, it } from 'vitest';
import { createApi } from '@lso/api';
import { testEnv } from '../helpers/env.js';

const env = testEnv();
const { app, pool, redis } = createApi(env);

afterAll(async () => {
  await pool.end();
  redis.disconnect();
});

describe('GET /health', () => {
  it('reports postgres and redis as ok', async () => {
    const response = await app.request('/health');
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      service: string;
      dependencies: { postgres: { status: string }; redis: { status: string } };
    };
    expect(body.service).toBe('api');
    expect(body.status).toBe('ok');
    expect(body.dependencies.postgres.status).toBe('ok');
    expect(body.dependencies.redis.status).toBe('ok');
  });
});

describe('GET /health/live and /health/ready', () => {
  it('live returns ok without dependency checks', async () => {
    const response = await app.request('/health/live');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; service: string };
    expect(body).toEqual({ status: 'ok', service: 'api' });
  });

  it('ready returns ok when postgres and redis are up', async () => {
    const response = await app.request('/health/ready');
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      dependencies: { postgres: { status: string }; redis: { status: string } };
    };
    expect(body.status).toBe('ok');
    expect(body.dependencies.postgres.status).toBe('ok');
    expect(body.dependencies.redis.status).toBe('ok');
  });

  it('propagates x-request-id correlation header', async () => {
    const response = await app.request('/health/live', {
      headers: { 'x-request-id': 'smoke-correlation-1' },
    });
    expect(response.headers.get('x-request-id')).toBe('smoke-correlation-1');
  });
});
