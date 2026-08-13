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
  DrizzleCrawlRepository,
  DrizzleJobRepository,
  DrizzlePageRepository,
  DrizzleWebsiteRepository,
} from '@lso/repositories';
import { CRAWL_JOB_NAME, CrawlService, JobService } from '@lso/services';
import { Worker, type Job } from 'bullmq';

const env = loadEnv();
const log = createLogger({ name: 'worker', level: env.LOG_LEVEL });
const redis = createRedis(env.REDIS_URL);
const pool = createPool(env.DATABASE_URL);
const db = createDb(pool);
const startedAt = new Date().toISOString();
const queueName = QUEUE_NAMES.crawl;

await writeHealthStartedAt(redis, startedAt);

const jobRepo = new DrizzleJobRepository(db);
const crawlQueue = createQueue(queueName, redis);
const crawlService = new CrawlService(
  new DrizzleWebsiteRepository(db),
  new DrizzleCrawlRepository(db),
  new DrizzlePageRepository(db),
  jobRepo,
  new JobService(jobRepo),
  crawlQueue,
  env,
);

const worker = new Worker(
  queueName,
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

worker.on('failed', (job, error) => {
  log.error({ bullJobId: job?.id, err: error.message }, 'crawl job failed');
});

log.info({ key: 'lso:health:started_at', startedAt, queue: queueName }, 'worker ready');

async function shutdown(): Promise<void> {
  await worker.close();
  await crawlQueue.close();
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
