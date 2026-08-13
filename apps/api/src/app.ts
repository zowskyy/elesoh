import type { Env } from '@lso/config';
import { createDb, createPool, type Database } from '@lso/database';
import { createRedis } from '@lso/queue';
import {
  DrizzleBusinessRepository,
  DrizzleJobRepository,
  DrizzleWebsiteRepository,
} from '@lso/repositories';
import { BusinessService, JobService, WebsiteService } from '@lso/services';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Redis } from 'ioredis';
import type pg from 'pg';
import type { AppEnv } from './env.js';
import { errorHandler } from './middleware/error.js';
import { registerBusinessRoutes } from './routes/businesses.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerWebsiteRoutes } from './routes/websites.js';

export interface ApiDependencies {
  pool: pg.Pool;
  db: Database;
  redis: Redis;
  startedAt: string;
  businessService: BusinessService;
  websiteService: WebsiteService;
  jobService: JobService;
}

export function createApp(deps: ApiDependencies): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use('*', cors());
  app.use('*', async (c, next) => {
    c.set('pool', deps.pool);
    c.set('db', deps.db);
    c.set('redis', deps.redis);
    c.set('startedAt', deps.startedAt);
    c.set('businessService', deps.businessService);
    c.set('websiteService', deps.websiteService);
    c.set('jobService', deps.jobService);
    await next();
  });
  app.onError(errorHandler);
  registerHealthRoutes(app);
  registerBusinessRoutes(app);
  registerWebsiteRoutes(app);
  return app;
}

export function createApi(env: Env): {
  app: Hono<AppEnv>;
  pool: pg.Pool;
  redis: Redis;
  startedAt: string;
} {
  const startedAt = new Date().toISOString();
  const pool = createPool(env.DATABASE_URL);
  const db = createDb(pool);
  const redis = createRedis(env.REDIS_URL);
  const businessService = new BusinessService(new DrizzleBusinessRepository(db));
  const websiteService = new WebsiteService(new DrizzleWebsiteRepository(db));
  const jobService = new JobService(new DrizzleJobRepository(db));
  const app = createApp({
    pool,
    db,
    redis,
    startedAt,
    businessService,
    websiteService,
    jobService,
  });
  return { app, pool, redis, startedAt };
}
