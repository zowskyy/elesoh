import type { Database } from '@lso/database';
import type { BusinessService, JobService, WebsiteService } from '@lso/services';
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
  };
};
