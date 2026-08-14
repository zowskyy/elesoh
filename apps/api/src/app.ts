import type { Env } from '@lso/config';
import { createDb, createPool, type Database } from '@lso/database';
import { createLogger, type Logger } from '@lso/logging';
import { createQueue, createRedis, QUEUE_NAMES } from '@lso/queue';
import {
  DrizzleAuditRepository,
  DrizzleBusinessRepository,
  DrizzleCrawlRepository,
  DrizzleFindingRepository,
  DrizzleJobRepository,
  DrizzleOpportunityRepository,
  DrizzlePageRepository,
  DrizzleProviderRunRepository,
  DrizzleRecommendationRepository,
  DrizzleReportRepository,
  DrizzleScoreRepository,
  DrizzleWebsiteRepository,
} from '@lso/repositories';
import {
  AnalyzeService,
  AuditService,
  BusinessService,
  CrawlService,
  DiscoveryService,
  JobService,
  ReportService,
  WebsiteService,
} from '@lso/services';
import type { Queue } from 'bullmq';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Redis } from 'ioredis';
import type pg from 'pg';
import type { AppEnv } from './env.js';
import { errorHandler } from './middleware/error.js';
import { createRequestContextMiddleware } from './middleware/request-context.js';
import { registerAnalyzeRoutes } from './routes/analyze.js';
import { registerAuditRoutes } from './routes/audits.js';
import { registerBusinessRoutes } from './routes/businesses.js';
import { registerCrawlRoutes } from './routes/crawls.js';
import { registerDiscoveryRoutes } from './routes/discoveries.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerPlanRoutes } from './routes/plans.js';
import { registerReportRoutes } from './routes/reports.js';
import { registerWebsiteRoutes } from './routes/websites.js';

export interface ApiDependencies {
  env: Env;
  pool: pg.Pool;
  db: Database;
  redis: Redis;
  startedAt: string;
  logger: Logger;
  analyzeService: AnalyzeService;
  businessService: BusinessService;
  websiteService: WebsiteService;
  jobService: JobService;
  crawlService: CrawlService;
  auditService: AuditService;
  reportService: ReportService;
  discoveryService: DiscoveryService;
  crawlQueue: Queue;
  auditQueue: Queue;
  reportQueue: Queue;
  discoveryQueue: Queue;
}

export function createApp(deps: ApiDependencies): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use('*', cors());
  app.use('*', createRequestContextMiddleware(deps.logger));
  app.use('*', async (c, next) => {
    c.set('env', deps.env);
    c.set('pool', deps.pool);
    c.set('db', deps.db);
    c.set('redis', deps.redis);
    c.set('startedAt', deps.startedAt);
    c.set('analyzeService', deps.analyzeService);
    c.set('businessService', deps.businessService);
    c.set('websiteService', deps.websiteService);
    c.set('jobService', deps.jobService);
    c.set('crawlService', deps.crawlService);
    c.set('auditService', deps.auditService);
    c.set('reportService', deps.reportService);
    c.set('discoveryService', deps.discoveryService);
    c.set('crawlQueue', deps.crawlQueue);
    c.set('auditQueue', deps.auditQueue);
    c.set('reportQueue', deps.reportQueue);
    c.set('discoveryQueue', deps.discoveryQueue);
    await next();
  });
  app.onError(errorHandler);
  registerHealthRoutes(app);
  registerPlanRoutes(app);
  registerAnalyzeRoutes(app);
  registerBusinessRoutes(app);
  registerWebsiteRoutes(app);
  registerCrawlRoutes(app);
  registerAuditRoutes(app);
  registerReportRoutes(app);
  registerDiscoveryRoutes(app);
  return app;
}

export function createApi(
  env: Env,
  options: { logger?: Logger } = {},
): {
  app: Hono<AppEnv>;
  pool: pg.Pool;
  redis: Redis;
  crawlQueue: Queue;
  auditQueue: Queue;
  reportQueue: Queue;
  discoveryQueue: Queue;
  startedAt: string;
  logger: Logger;
} {
  const startedAt = new Date().toISOString();
  const logger = options.logger ?? createLogger({ name: 'api', level: env.LOG_LEVEL });
  const pool = createPool(env.DATABASE_URL);
  const db = createDb(pool);
  const redis = createRedis(env.REDIS_URL);
  const crawlQueue = createQueue(QUEUE_NAMES.crawl, redis);
  const auditQueue = createQueue(QUEUE_NAMES.audit, redis);
  const reportQueue = createQueue(QUEUE_NAMES.report, redis);
  const discoveryQueue = createQueue(QUEUE_NAMES.discovery, redis);
  const businessRepo = new DrizzleBusinessRepository(db);
  const websiteRepo = new DrizzleWebsiteRepository(db);
  const jobRepo = new DrizzleJobRepository(db);
  const crawlRepo = new DrizzleCrawlRepository(db);
  const pageRepo = new DrizzlePageRepository(db);
  const auditRepo = new DrizzleAuditRepository(db);
  const findingRepo = new DrizzleFindingRepository(db);
  const recommendationRepo = new DrizzleRecommendationRepository(db);
  const scoreRepo = new DrizzleScoreRepository(db);
  const reportRepo = new DrizzleReportRepository(db);
  const opportunityRepo = new DrizzleOpportunityRepository(db);
  const providerRunRepo = new DrizzleProviderRunRepository(db);
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
  const analyzeService = new AnalyzeService(
    businessService,
    websiteService,
    crawlService,
    websiteRepo,
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
  const reportService = new ReportService(
    auditRepo,
    websiteRepo,
    businessRepo,
    findingRepo,
    recommendationRepo,
    scoreRepo,
    reportRepo,
    jobRepo,
    jobService,
    reportQueue,
    env,
  );
  const discoveryService = new DiscoveryService(
    businessRepo,
    websiteRepo,
    opportunityRepo,
    providerRunRepo,
    jobRepo,
    jobService,
    discoveryQueue,
    env,
  );
  const app = createApp({
    env,
    pool,
    db,
    redis,
    startedAt,
    logger,
    analyzeService,
    businessService,
    websiteService,
    jobService,
    crawlService,
    auditService,
    reportService,
    discoveryService,
    crawlQueue,
    auditQueue,
    reportQueue,
    discoveryQueue,
  });
  return {
    app,
    pool,
    redis,
    crawlQueue,
    auditQueue,
    reportQueue,
    discoveryQueue,
    startedAt,
    logger,
  };
}
