import { loadEnv } from '@lso/config';
import { createDb, createPool } from '@lso/database';
import { createLogger } from '@lso/logging';
import {
  BULLMQ_PREFIX,
  createQueue,
  createRedis,
  QUEUE_NAMES,
  writeHealthStartedAt,
} from '@lso/queue';
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
  AI_REPORT_JOB_NAME,
  AuditService,
  CRAWL_JOB_NAME,
  CrawlService,
  DISCOVER_JOB_NAME,
  DiscoveryService,
  FULL_AUDIT_JOB_NAME,
  JobService,
  PDF_REPORT_JOB_NAME,
  ReportService,
  SEO_AUDIT_JOB_NAME,
} from '@lso/services';
import type { DiscoverQuery } from '@lso/discovery';
import { Worker, type Job } from 'bullmq';

const env = loadEnv();
const log = createLogger({ name: 'worker', level: env.LOG_LEVEL });
const redis = createRedis(env.REDIS_URL);
const pool = createPool(env.DATABASE_URL);
const db = createDb(pool);
const startedAt = new Date().toISOString();

await writeHealthStartedAt(redis, startedAt);

const jobRepo = new DrizzleJobRepository(db);
const websiteRepo = new DrizzleWebsiteRepository(db);
const businessRepo = new DrizzleBusinessRepository(db);
const crawlRepo = new DrizzleCrawlRepository(db);
const pageRepo = new DrizzlePageRepository(db);
const auditRepo = new DrizzleAuditRepository(db);
const findingRepo = new DrizzleFindingRepository(db);
const recommendationRepo = new DrizzleRecommendationRepository(db);
const scoreRepo = new DrizzleScoreRepository(db);
const reportRepo = new DrizzleReportRepository(db);
const opportunityRepo = new DrizzleOpportunityRepository(db);
const providerRunRepo = new DrizzleProviderRunRepository(db);
const jobService = new JobService(jobRepo);
const crawlQueue = createQueue(QUEUE_NAMES.crawl, redis);
const auditQueue = createQueue(QUEUE_NAMES.audit, redis);
const reportQueue = createQueue(QUEUE_NAMES.report, redis);
const discoveryQueue = createQueue(QUEUE_NAMES.discovery, redis);

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

const crawlWorker = new Worker(
  QUEUE_NAMES.crawl,
  async (job: Job) => {
    const jobId = String(job.data['jobId'] ?? '');
    const crawlId = String(job.data['crawlId'] ?? '');
    const url = String(job.data['url'] ?? '');
    log.info({ bullJobId: job.id, jobId, crawlId, url, name: CRAWL_JOB_NAME }, 'crawl job started');
    const result = await crawlService.executeCrawlJob({ jobId, crawlId, url });
    log.info({ jobId, crawlId, pageCount: result.pageCount }, 'crawl job completed');
    return result;
  },
  { connection: redis, prefix: BULLMQ_PREFIX, concurrency: 1 },
);

const auditWorker = new Worker(
  QUEUE_NAMES.audit,
  async (job: Job) => {
    const jobId = String(job.data['jobId'] ?? '');
    const auditId = String(job.data['auditId'] ?? '');
    const websiteId = String(job.data['websiteId'] ?? '');
    const url = String(job.data['url'] ?? '');
    const mode = job.data['mode'] === 'full' ? 'full' : 'seo';
    const crawlIdRaw = job.data['crawlId'];
    const crawlId = typeof crawlIdRaw === 'string' ? crawlIdRaw : null;
    log.info(
      {
        bullJobId: job.id,
        jobId,
        auditId,
        mode,
        name: mode === 'full' ? FULL_AUDIT_JOB_NAME : SEO_AUDIT_JOB_NAME,
      },
      'audit job started',
    );
    const result = await auditService.executeAuditJob({
      jobId,
      auditId,
      websiteId,
      url,
      mode,
      crawlId,
    });
    log.info(
      { jobId, auditId, findingCount: result.findingCount, overall: result.overall },
      'audit job completed',
    );
    return result;
  },
  { connection: redis, prefix: BULLMQ_PREFIX, concurrency: 1 },
);

const reportWorker = new Worker(
  QUEUE_NAMES.report,
  async (job: Job) => {
    const jobId = String(job.data['jobId'] ?? '');
    const auditId = String(job.data['auditId'] ?? '');
    const format = job.data['format'] === 'pdf' ? 'pdf' : 'html';
    log.info(
      {
        bullJobId: job.id,
        jobId,
        auditId,
        format,
        name: format === 'pdf' ? PDF_REPORT_JOB_NAME : AI_REPORT_JOB_NAME,
      },
      'report job started',
    );
    const result = await reportService.executeReportJob({ jobId, auditId, format });
    log.info({ jobId, auditId, reportIds: result.reportIds }, 'report job completed');
    return result;
  },
  { connection: redis, prefix: BULLMQ_PREFIX, concurrency: 1 },
);

const discoveryWorker = new Worker(
  QUEUE_NAMES.discovery,
  async (job: Job) => {
    const jobId = String(job.data['jobId'] ?? '');
    const providerRunId = String(job.data['providerRunId'] ?? '');
    const query = job.data['query'] as DiscoverQuery;
    log.info(
      { bullJobId: job.id, jobId, providerRunId, name: DISCOVER_JOB_NAME },
      'discovery job started',
    );
    const result = await discoveryService.executeDiscoverJob({
      jobId,
      providerRunId,
      query,
    });
    log.info({ jobId, providerRunId, ...result }, 'discovery job completed');
    return result;
  },
  { connection: redis, prefix: BULLMQ_PREFIX, concurrency: 1 },
);

crawlWorker.on('failed', (job, error) => {
  log.error({ bullJobId: job?.id, err: error.message }, 'crawl job failed');
});
auditWorker.on('failed', (job, error) => {
  log.error({ bullJobId: job?.id, err: error.message }, 'audit job failed');
});
reportWorker.on('failed', (job, error) => {
  log.error({ bullJobId: job?.id, err: error.message }, 'report job failed');
});
discoveryWorker.on('failed', (job, error) => {
  log.error({ bullJobId: job?.id, err: error.message }, 'discovery job failed');
});

log.info(
  {
    key: 'lso:health:started_at',
    startedAt,
    queues: [
      QUEUE_NAMES.crawl,
      QUEUE_NAMES.audit,
      QUEUE_NAMES.report,
      QUEUE_NAMES.discovery,
    ],
  },
  'worker ready',
);

async function shutdown(): Promise<void> {
  await crawlWorker.close();
  await auditWorker.close();
  await reportWorker.close();
  await discoveryWorker.close();
  await crawlQueue.close();
  await auditQueue.close();
  await reportQueue.close();
  await discoveryQueue.close();
  await pool.end();
  redis.disconnect();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
