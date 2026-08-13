import { loadEnv } from '@lso/config';
import { createLogger } from '@lso/logging';
import { createRedis, pingRedis, writeHealthStartedAt } from '@lso/queue';

const env = loadEnv();
const log = createLogger({ name: 'worker', level: env.LOG_LEVEL });
const redis = createRedis(env.REDIS_URL);
const startedAt = new Date().toISOString();

await pingRedis(redis);
await writeHealthStartedAt(redis, startedAt);
log.info({ key: 'lso:health:started_at', startedAt }, 'worker connected to Redis');

function shutdown(): void {
  redis.disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await new Promise(() => {
  /* keep the worker process alive until Stage B processors exist */
});
