import type { Env } from '@lso/config';
import { createDb, createPool, type Database } from '@lso/database';
import { createQueue, createRedis, QUEUE_NAMES } from '@lso/queue';
import {
  DrizzleAuditRepository,
  DrizzleBusinessRepository,
  DrizzleCrawlRepository,
  DrizzleFindingRepository,
  DrizzleJobRepository,
  DrizzlePageRepository,
  DrizzleRecommendationRepository,
  DrizzleScoreRepository,
  DrizzleWebsiteRepository,
} from '@lso/repositories';
import {
  AuditService,
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
import { registerAuditRoutes } from './routes/audits.js';
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
  auditService: AuditService;
  crawlQueue: Queue;
  auditQueue: Queue;
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
    c.set('auditService', deps.auditService);
    c.set('crawlQueue', deps.crawlQueue);
    c.set('auditQueue', deps.auditQueue);
    await next();
  });
  app.onError(errorHandler);
  registerHealthRoutes(app);
  registerBusinessRoutes(app);
  registerWebsiteRoutes(app);
  registerCrawlRoutes(app);
  registerAuditRoutes(app);
  return app;
}

export function createApi(env: Env): {
  app: Hono<AppEnv>;
  pool: pg.Pool;
  redis: Redis;
  crawlQueue: Queue;
  auditQueue: Queue;
  startedAt: string;
} {
  const startedAt = new Date().toISOString();
  const pool = createPool(env.DATABASE_URL);
  const db = createDb(pool);
  const redis = createRedis(env.REDIS_URL);
  const crawlQueue = createQueue(QUEUE_NAMES.crawl, redis);
  const auditQueue = createQueue(QUEUE_NAMES.audit, redis);
  const businessRepo = new DrizzleBusinessRepository(db);
  const websiteRepo = new DrizzleWebsiteRepository(db);
  const jobRepo = new DrizzleJobRepository(db);
  const crawlRepo = new DrizzleCrawlRepository(db);
  const pageRepo = new DrizzlePageRepository(db);
  const auditRepo = new DrizzleAuditRepository(db);
  const findingRepo = new DrizzleFindingRepository(db);
  const recommendationRepo = new DrizzleRecommendationRepository(db);
  const scoreRepo = new DrizzleScoreRepository(db);
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
  const auditService = new AuditService(
    websiteRepo,
    crawlRepo,
    pageRepo,
    auditRepo,
    findingRepo,
    recommendationRepo,
    scoreRepo,
    jobRepo,
    jobService,
    auditQueue,
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
    auditService,
    crawlQueue,
    auditQueue,
  });
  return { app, pool, redis, crawlQueue, auditQueue, startedAt };
}
