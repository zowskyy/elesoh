import { createRequestId, withCorrelationId, type Logger } from '@lso/logging';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../env.js';

export function createRequestContextMiddleware(rootLogger: Logger): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const requestId = createRequestId(c.req.header('x-request-id'));
    const logger = withCorrelationId(rootLogger, requestId);
    c.set('requestId', requestId);
    c.set('logger', logger);
    c.header('x-request-id', requestId);
    const started = Date.now();
    try {
      await next();
    } finally {
      logger.info(
        {
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          durationMs: Date.now() - started,
        },
        'request completed',
      );
    }
  };
}
