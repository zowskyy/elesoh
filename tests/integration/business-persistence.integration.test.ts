import { describe, expect, it } from 'vitest';
import { createApi } from '@lso/api';
import { testEnv } from '../helpers/env.js';

const env = testEnv();

describe('business persistence', () => {
  it('creates, lists, and survives a new API instance', async () => {
    const first = createApi(env);
    const name = `Restart Cafe ${Date.now()}`;
    try {
      const createdResponse = await first.app.request('/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      expect(createdResponse.status).toBe(201);
      const created = (await createdResponse.json()) as { id: string; name: string };
      expect(created.name).toBe(name);

      const listResponse = await first.app.request('/businesses');
      const listed = (await listResponse.json()) as Array<{ id: string }>;
      expect(listed.some((row) => row.id === created.id)).toBe(true);

      await first.pool.end();
      first.redis.disconnect();

      const restarted = createApi(env);
      try {
        const fetched = await restarted.app.request(`/businesses/${created.id}`);
        expect(fetched.status).toBe(200);
        const body = (await fetched.json()) as { id: string; name: string };
        expect(body.id).toBe(created.id);
        expect(body.name).toBe(name);
      } finally {
        await restarted.pool.end();
        restarted.redis.disconnect();
      }
    } catch (error) {
      try {
        await first.pool.end();
      } catch {
        /* already closed */
      }
      first.redis.disconnect();
      throw error;
    }
  });
});
