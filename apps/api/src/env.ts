import type { Database } from '@lso/database';
import type { Logger } from '@lso/logging';
import type {
  AuditService,
  BusinessService,
  CrawlService,
  DiscoveryService,
  JobService,
  ReportService,
  WebsiteService,
} from '@lso/services';
import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import type pg from 'pg';

export type AppEnv = {
  Variables: {
    pool: pg.Pool;
    db: Database;
    redis: Redis;
    startedAt: string;
    requestId: string;
    logger: Logger;
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
  };
};
