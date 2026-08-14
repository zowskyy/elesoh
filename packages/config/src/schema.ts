import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CRAWLER_MAX_PAGES: z.coerce.number().int().positive().default(100),
  CRAWLER_MAX_DEPTH: z.coerce.number().int().nonnegative().default(3),
  CRAWLER_CONCURRENCY: z.coerce.number().int().positive().default(2),
  CRAWLER_TIMEOUT: z.coerce.number().int().positive().default(10_000),
  CRAWLER_ALLOW_LOCALHOST: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  CRAWLER_ENGINE: z.enum(['playwright', 'fetch']).default('playwright'),
  AUDIT_TIMEOUT: z.coerce.number().int().positive().default(300_000),
  AUDIT_RULESET_VERSION: z.string().min(1).default('seo-v1'),
  PERFORMANCE_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  OLLAMA_URL: z.string().min(1).default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: z.string().min(1).default('llama3.2'),
  AI_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  REPORT_DIRECTORY: z.string().min(1).default('./reports'),
  DISCOVERY_PROVIDER: z.string().min(1).default('imported'),
});

export type Env = z.infer<typeof envSchema>;
