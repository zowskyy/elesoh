import { loadEnv } from '@lso/config';
import { createLogger } from '@lso/logging';
import { serve } from '@hono/node-server';
import { createApi } from './app.js';

const env = loadEnv();
const log = createLogger({ name: 'api', level: env.LOG_LEVEL });
const { app, pool, redis } = createApi(env);

const server = serve({ fetch: app.fetch, port: env.API_PORT }, () => {
  log.info({ port: env.API_PORT }, 'api listening');
});

async function shutdown(): Promise<void> {
  server.close();
  await pool.end();
  redis.disconnect();
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
