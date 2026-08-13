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
  CRAWL_JOB_NAME,
  CrawlService,
  FULL_AUDIT_JOB_NAME,
  JobService,
  SEO_AUDIT_JOB_NAME,
} from '@lso/services';
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
const crawlRepo = new DrizzleCrawlRepository(db);
const pageRepo = new DrizzlePageRepository(db);
const jobService = new JobService(jobRepo);
const crawlQueue = createQueue(QUEUE_NAMES.crawl, redis);
const auditQueue = createQueue(QUEUE_NAMES.audit, redis);

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
  new DrizzleAuditRepository(db),
  new DrizzleFindingRepository(db),
  new DrizzleRecommendationRepository(db),
  new DrizzleScoreRepository(db),
  jobRepo,
  jobService,
  auditQueue,
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
  {
    connection: redis,
    prefix: BULLMQ_PREFIX,
    concurrency: 1,
  },
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
  {
    connection: redis,
    prefix: BULLMQ_PREFIX,
    concurrency: 1,
  },
);

crawlWorker.on('failed', (job, error) => {
  log.error({ bullJobId: job?.id, err: error.message }, 'crawl job failed');
});
auditWorker.on('failed', (job, error) => {
  log.error({ bullJobId: job?.id, err: error.message }, 'audit job failed');
});

log.info(
  { key: 'lso:health:started_at', startedAt, queues: [QUEUE_NAMES.crawl, QUEUE_NAMES.audit] },
  'worker ready',
);

async function shutdown(): Promise<void> {
  await crawlWorker.close();
  await auditWorker.close();
  await crawlQueue.close();
  await auditQueue.close();
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
