import { loadEnv, type Env } from '@lso/config';
import { createDb, createPool } from '@lso/database';
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
  DrizzleScoreRepository,
  DrizzleWebsiteRepository,
} from '@lso/repositories';
import {
  AuditService,
  BusinessService,
  CrawlService,
  DiscoveryService,
  JobService,
  WebsiteService,
} from '@lso/services';

export interface McpServices {
  env: Env;
  businessService: BusinessService;
  websiteService: WebsiteService;
  crawlService: CrawlService;
  auditService: AuditService;
  discoveryService: DiscoveryService;
  jobService: JobService;
  shutdown: () => Promise<void>;
}

export function createMcpServices(env: Env = loadEnv()): McpServices {
  const pool = createPool(env.DATABASE_URL);
  const db = createDb(pool);
  const redis = createRedis(env.REDIS_URL);
  const crawlQueue = createQueue(QUEUE_NAMES.crawl, redis);
  const auditQueue = createQueue(QUEUE_NAMES.audit, redis);
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
  const opportunityRepo = new DrizzleOpportunityRepository(db);
  const providerRunRepo = new DrizzleProviderRunRepository(db);
  const jobService = new JobService(jobRepo);

  return {
    env,
    businessService: new BusinessService(businessRepo),
    websiteService: new WebsiteService(websiteRepo),
    crawlService: new CrawlService(
      websiteRepo,
      crawlRepo,
      pageRepo,
      jobRepo,
      jobService,
      crawlQueue,
      env,
    ),
    auditService: new AuditService(
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
    ),
    discoveryService: new DiscoveryService(
      businessRepo,
      websiteRepo,
      opportunityRepo,
      providerRunRepo,
      jobRepo,
      jobService,
      discoveryQueue,
      env,
    ),
    jobService,
    shutdown: async () => {
      await crawlQueue.close();
      await auditQueue.close();
      await discoveryQueue.close();
      await pool.end();
      redis.disconnect();
    },
  };
}
