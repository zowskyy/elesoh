import { enqueueCrawlRequestSchema } from '@lso/schemas';
import type { Hono } from 'hono';
import type { AppEnv } from '../env.js';
import { toCrawlDto, toJobDto } from '../mappers.js';

export function registerCrawlRoutes(app: Hono<AppEnv>): void {
  app.post('/websites/:id/crawls', async (c) => {
    const body = enqueueCrawlRequestSchema.parse(
      (await c.req.json().catch(() => ({}))) as unknown,
    );
    const result = await c
      .get('crawlService')
      .enqueueCrawl(
        c.req.param('id'),
        body.idempotencyKey === undefined ? undefined : body.idempotencyKey,
      );
    return c.json(
      {
        job: toJobDto(result.job),
        crawl: toCrawlDto(result.crawl),
        created: result.created,
      },
      result.created ? 202 : 200,
    );
  });

  app.get('/crawls/:id', async (c) => {
    const crawl = await c.get('crawlService').getCrawl(c.req.param('id'));
    return c.json(toCrawlDto(crawl));
  });

  app.get('/jobs/:id', async (c) => {
    const job = await c.get('crawlService').getJob(c.req.param('id'));
    return c.json(toJobDto(job));
  });
}
