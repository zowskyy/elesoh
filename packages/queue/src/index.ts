import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { BULLMQ_PREFIX, QUEUE_NAMES, REDIS_KEY } from './keys.js';

export function createRedis(url: string): Redis {
  return new Redis(url, { maxRetriesPerRequest: null });
}

export async function pingRedis(redis: Redis): Promise<void> {
  const result = await redis.ping();
  if (result !== 'PONG') {
    throw new Error(`Unexpected Redis ping response: ${result}`);
  }
}

export async function writeHealthStartedAt(redis: Redis, startedAt: string): Promise<void> {
  await redis.set(REDIS_KEY.healthStartedAt, startedAt);
}

export function createQueue(name: string, redis: Redis): Queue {
  return new Queue(name, { connection: redis, prefix: BULLMQ_PREFIX });
}

export { BULLMQ_PREFIX, QUEUE_NAMES, REDIS_KEY };
