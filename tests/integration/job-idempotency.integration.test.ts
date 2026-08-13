import { afterAll, describe, expect, it } from 'vitest';
import { loadEnv } from '@lso/config';
import { createDb, createPool } from '@lso/database';
import { DrizzleJobRepository } from '@lso/repositories';
import { JobService } from '@lso/services';

const env = loadEnv();
const pool = createPool(env.DATABASE_URL);
const db = createDb(pool);
const jobs = new JobService(new DrizzleJobRepository(db));

afterAll(async () => {
  await pool.end();
});

describe('JobService idempotency', () => {
  it('returns the existing job for the same idempotency key', async () => {
    const key = `test-job-${Date.now()}`;
    const first = await jobs.createIfAbsent({
      type: 'CRAWL_WEBSITE',
      idempotencyKey: key,
      payload: { websiteId: '11111111-1111-4111-8111-111111111111' },
    });
    const second = await jobs.createIfAbsent({
      type: 'CRAWL_WEBSITE',
      idempotencyKey: key,
      payload: { websiteId: '22222222-2222-4222-8222-222222222222' },
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.job.id).toBe(first.job.id);
    expect(second.job.payload['websiteId']).toBe('11111111-1111-4111-8111-111111111111');
  });
});
