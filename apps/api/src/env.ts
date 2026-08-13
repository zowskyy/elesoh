import type { Database } from '@lso/database';
import type { BusinessService, CrawlService, JobService, WebsiteService } from '@lso/services';
import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import type pg from 'pg';

export type AppEnv = {
  Variables: {
    pool: pg.Pool;
    db: Database;
    redis: Redis;
    startedAt: string;
    businessService: BusinessService;
    websiteService: WebsiteService;
    jobService: JobService;
    crawlService: CrawlService;
    crawlQueue: Queue;
  };
};
