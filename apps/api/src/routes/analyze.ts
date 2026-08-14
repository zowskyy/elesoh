import {
  analyzeRequestSchema,
  batchAnalyzeRequestSchema,
  type BatchAnalyzeResponse,
} from '@lso/schemas';
import type { TaylorBatch } from '@lso/services';
import type { Hono } from 'hono';
import type { AppEnv } from '../env.js';
import { toBusinessDto, toCrawlDto, toJobDto, toWebsiteDto } from '../mappers.js';

function toBatchResponse(batch: TaylorBatch): BatchAnalyzeResponse {
  const completedCount = batch.items.filter((item) => item.stage === 'done').length;
  const failedCount = batch.items.filter((item) => item.stage === 'failed').length;
  return {
    batchId: batch.id,
    items: batch.items,
    completedCount,
    failedCount,
    totalCount: batch.items.length,
  };
}

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

  app.post('/analyze/batch', async (c) => {
    const body = batchAnalyzeRequestSchema.parse(await c.req.json());
    const env = c.get('env');
    const batch = await c.get('taylorBatchService').startBatch(body.urls, {
      allowLocalhost: env.CRAWLER_ALLOW_LOCALHOST,
      ...(body.idempotencyKey !== undefined ? { idempotencyKey: body.idempotencyKey } : {}),
    });
    return c.json(toBatchResponse(batch), 202);
  });

  app.get('/analyze/batch/:batchId', async (c) => {
    const batchId = c.req.param('batchId');
    const batch = await c.get('taylorBatchService').getBatch(batchId);
    if (batch === null) {
      return c.json({ error: 'not_found', message: `Batch not found: ${batchId}` }, 404);
    }
    return c.json(toBatchResponse(batch));
  });
}
