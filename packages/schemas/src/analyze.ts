import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  url: z.string().min(1).max(2000),
  businessName: z.string().min(1).max(200).optional(),
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export const batchAnalyzeRequestSchema = z.object({
  urls: z.array(z.string().min(1).max(2000)).min(1).max(50),
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export type BatchAnalyzeRequest = z.infer<typeof batchAnalyzeRequestSchema>;

export const batchAnalyzeItemSchema = z.object({
  url: z.string(),
  websiteId: z.string().uuid(),
  auditId: z.string().uuid().nullable(),
  stage: z.enum([
    'crawl',
    'audit',
    'report',
    'done',
    'failed',
  ]),
  crawlJobId: z.string().uuid(),
  auditJobId: z.string().uuid().nullable(),
  reportJobId: z.string().uuid().nullable(),
  reportId: z.string().uuid().nullable(),
  score: z
    .object({
      overall: z.number(),
      seo: z.number(),
      performance: z.number().nullable(),
    })
    .nullable(),
  topIssues: z.array(
    z.object({
      ruleId: z.string(),
      outcome: z.string(),
      summary: z.string(),
      action: z.string(),
      priority: z.string(),
    }),
  ),
  error: z.string().nullable(),
});

export type BatchAnalyzeItem = z.infer<typeof batchAnalyzeItemSchema>;

export const batchAnalyzeResponseSchema = z.object({
  batchId: z.string().uuid(),
  items: z.array(batchAnalyzeItemSchema),
  completedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});

export type BatchAnalyzeResponse = z.infer<typeof batchAnalyzeResponseSchema>;
