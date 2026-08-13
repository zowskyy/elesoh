import { enqueueAuditRequestSchema } from '@lso/schemas';
import type { Hono } from 'hono';
import type { AppEnv } from '../env.js';
import {
  toAuditDto,
  toFindingDto,
  toJobDto,
  toRecommendationDto,
  toScoreDto,
} from '../mappers.js';

export function registerAuditRoutes(app: Hono<AppEnv>): void {
  app.post('/websites/:id/audits', async (c) => {
    const body = enqueueAuditRequestSchema.parse(
      (await c.req.json().catch(() => ({}))) as unknown,
    );
    const result = await c.get('auditService').enqueueAudit(
      c.req.param('id'),
      body.mode,
      body.idempotencyKey === undefined ? undefined : body.idempotencyKey,
    );
    return c.json(
      {
        job: toJobDto(result.job),
        audit: toAuditDto(result.audit),
        created: result.created,
      },
      result.created ? 202 : 200,
    );
  });

  app.get('/audits/:id', async (c) => {
    const audit = await c.get('auditService').getAudit(c.req.param('id'));
    return c.json(toAuditDto(audit));
  });

  app.get('/audits/:id/findings', async (c) => {
    const findings = await c.get('auditService').listFindings(c.req.param('id'));
    return c.json(findings.map(toFindingDto));
  });

  app.get('/audits/:id/recommendations', async (c) => {
    const recommendations = await c.get('auditService').listRecommendations(c.req.param('id'));
    return c.json(recommendations.map(toRecommendationDto));
  });

  app.get('/audits/:id/score', async (c) => {
    const score = await c.get('auditService').getScore(c.req.param('id'));
    return c.json(toScoreDto(score));
  });
}
