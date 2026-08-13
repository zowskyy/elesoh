import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const required = {
  DATABASE_URL: 'postgres://lso:lso@localhost:5432/lso',
  REDIS_URL: 'redis://localhost:6379/0',
};

describe('parseEnv', () => {
  it('applies defaults for optional keys', () => {
    const env = parseEnv(required);
    expect(env.API_PORT).toBe(3001);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.CRAWLER_MAX_PAGES).toBe(100);
  });

  it('rejects missing DATABASE_URL', () => {
    expect(() => parseEnv({ REDIS_URL: required.REDIS_URL })).toThrow();
  });

  it('coerces numeric strings', () => {
    const env = parseEnv({ ...required, API_PORT: '4010' });
    expect(env.API_PORT).toBe(4010);
  });
});
