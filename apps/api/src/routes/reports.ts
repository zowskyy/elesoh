import { enqueueReportRequestSchema } from '@lso/schemas';
import type { Hono } from 'hono';
import type { AppEnv } from '../env.js';
import { toJobDto, toReportDto } from '../mappers.js';

export function registerReportRoutes(app: Hono<AppEnv>): void {
  app.post('/audits/:id/reports', async (c) => {
    const body = enqueueReportRequestSchema.parse(
      (await c.req.json().catch(() => ({}))) as unknown,
    );
    const result = await c.get('reportService').enqueueReport(
      c.req.param('id'),
      body.format,
      body.idempotencyKey === undefined ? undefined : body.idempotencyKey,
    );
    return c.json(
      {
        job: toJobDto(result.job),
        created: result.created,
      },
      result.created ? 202 : 200,
    );
  });

  app.get('/audits/:id/reports', async (c) => {
    const reports = await c.get('reportService').listReports(c.req.param('id'));
    return c.json(reports.map(toReportDto));
  });

  app.get('/reports/:id', async (c) => {
    const report = await c.get('reportService').getReport(c.req.param('id'));
    return c.json(toReportDto(report));
  });
}
