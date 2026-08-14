import { enqueueReportRequestSchema } from '@lso/schemas';
import { readFile } from 'node:fs/promises';
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

  app.get('/reports/:id/content', async (c) => {
    const { report, absolutePath } = await c.get('reportService').resolveReportFile(c.req.param('id'));
    const bytes = await readFile(absolutePath);
    if (report.format === 'pdf') {
      return c.body(bytes, 200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${report.id}.pdf"`,
      });
    }
    return c.body(bytes, 200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${report.id}.html"`,
    });
  });
}
