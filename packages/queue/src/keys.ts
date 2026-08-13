export const REDIS_KEY = {
  healthStartedAt: 'lso:health:started_at',
  crawlProgress: (crawlId: string) => `lso:progress:crawl:${crawlId}`,
  robotsCache: (host: string) => `lso:cache:robots:${host}`,
  rateHost: (host: string) => `lso:rate:host:${host}`,
} as const;

export const BULLMQ_PREFIX = 'lso:bull';
export const QUEUE_NAMES = {
  crawl: 'crawl',
} as const;
