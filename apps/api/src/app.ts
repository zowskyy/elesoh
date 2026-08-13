import type { Env } from '@lso/config';
import { createDb, createPool, type Database } from '@lso/database';
import { createQueue, createRedis, QUEUE_NAMES } from '@lso/queue';
import {
  DrizzleBusinessRepository,
  DrizzleCrawlRepository,
  DrizzleJobRepository,
  DrizzlePageRepository,
  DrizzleWebsiteRepository,
} from '@lso/repositories';
import {
  BusinessService,
  CrawlService,
  JobService,
  WebsiteService,
} from '@lso/services';
import type { Queue } from 'bullmq';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Redis } from 'ioredis';
import type pg from 'pg';
import type { AppEnv } from './env.js';
import { errorHandler } from './middleware/error.js';
import { registerBusinessRoutes } from './routes/businesses.js';
import { registerCrawlRoutes } from './routes/crawls.js';
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
  crawlService: CrawlService;
  crawlQueue: Queue;
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
    c.set('crawlService', deps.crawlService);
    c.set('crawlQueue', deps.crawlQueue);
    await next();
  });
  app.onError(errorHandler);
  registerHealthRoutes(app);
  registerBusinessRoutes(app);
  registerWebsiteRoutes(app);
  registerCrawlRoutes(app);
  return app;
}

export function createApi(env: Env): {
  app: Hono<AppEnv>;
  pool: pg.Pool;
  redis: Redis;
  crawlQueue: Queue;
  startedAt: string;
} {
  const startedAt = new Date().toISOString();
  const pool = createPool(env.DATABASE_URL);
  const db = createDb(pool);
  const redis = createRedis(env.REDIS_URL);
  const crawlQueue = createQueue(QUEUE_NAMES.crawl, redis);
  const businessRepo = new DrizzleBusinessRepository(db);
  const websiteRepo = new DrizzleWebsiteRepository(db);
  const jobRepo = new DrizzleJobRepository(db);
  const crawlRepo = new DrizzleCrawlRepository(db);
  const pageRepo = new DrizzlePageRepository(db);
  const businessService = new BusinessService(businessRepo);
  const websiteService = new WebsiteService(websiteRepo);
  const jobService = new JobService(jobRepo);
  const crawlService = new CrawlService(
    websiteRepo,
    crawlRepo,
    pageRepo,
    jobRepo,
    jobService,
    crawlQueue,
    env,
  );
  const app = createApp({
    pool,
    db,
    redis,
    startedAt,
    businessService,
    websiteService,
    jobService,
    crawlService,
    crawlQueue,
  });
  return { app, pool, redis, crawlQueue, startedAt };
}
