import { analyzeRequestSchema } from '@lso/schemas';
import type { Hono } from 'hono';
import type { AppEnv } from '../env.js';
import { toBusinessDto, toCrawlDto, toJobDto, toWebsiteDto } from '../mappers.js';

export function registerAnalyzeRoutes(app: Hono<AppEnv>): void {
  app.post('/analyze', async (c) => {
    const body = analyzeRequestSchema.parse(await c.req.json());
    const env = c.get('env');
    const result = await c.get('analyzeService').startFromUrl(body.url, {
      ...(body.businessName !== undefined ? { businessName: body.businessName } : {}),
      ...(body.idempotencyKey !== undefined ? { idempotencyKey: body.idempotencyKey } : {}),
      allowLocalhost: env.CRAWLER_ALLOW_LOCALHOST,
    });
    return c.json(
      {
        url: result.url,
        business: toBusinessDto(result.business),
        website: toWebsiteDto(result.website),
        job: toJobDto(result.job),
        crawl: toCrawlDto(result.crawl),
        created: result.created,
      },
      result.created ? 202 : 200,
    );
  });
}
