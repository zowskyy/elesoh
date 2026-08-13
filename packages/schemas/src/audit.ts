import { z } from 'zod';

export const enqueueAuditRequestSchema = z.object({
  mode: z.enum(['seo', 'full']).default('seo'),
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export const auditDtoSchema = z.object({
  id: z.string().uuid(),
  websiteId: z.string().uuid(),
  crawlId: z.string().uuid().nullable(),
  mode: z.enum(['seo', 'full']),
  status: z.string(),
  version: z.string(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const findingDtoSchema = z.object({
  id: z.string().uuid(),
  auditRunId: z.string().uuid(),
  evidenceId: z.string().uuid(),
  ruleId: z.string(),
  outcome: z.enum(['PASS', 'WARN', 'FAIL', 'NOT_APPLICABLE', 'ERROR']),
  summary: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const recommendationDtoSchema = z.object({
  id: z.string().uuid(),
  findingId: z.string().uuid(),
  priority: z.string(),
  action: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const scoreDtoSchema = z.object({
  id: z.string().uuid(),
  auditRunId: z.string().uuid(),
  overall: z.number().int(),
  seo: z.number().int(),
  performance: z.number().int().nullable(),
  categories: z.record(z.number()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EnqueueAuditRequest = z.infer<typeof enqueueAuditRequestSchema>;
export type AuditDto = z.infer<typeof auditDtoSchema>;
export type FindingDto = z.infer<typeof findingDtoSchema>;
export type RecommendationDto = z.infer<typeof recommendationDtoSchema>;
export type ScoreDto = z.infer<typeof scoreDtoSchema>;
