import { z } from 'zod';

export const crawlDtoSchema = z.object({
  id: z.string().uuid(),
  websiteId: z.string().uuid(),
  status: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const enqueueCrawlRequestSchema = z.object({
  idempotencyKey: z.string().min(1).optional(),
});

export const jobDtoSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  status: z.string(),
  idempotencyKey: z.string().nullable(),
  payload: z.record(z.unknown()),
  attempts: z.number().int(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  error: z.string().nullable(),
});

export type CrawlDto = z.infer<typeof crawlDtoSchema>;
export type JobDto = z.infer<typeof jobDtoSchema>;
export type EnqueueCrawlRequest = z.infer<typeof enqueueCrawlRequestSchema>;
