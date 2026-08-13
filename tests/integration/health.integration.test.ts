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
