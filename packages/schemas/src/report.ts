import { z } from 'zod';

export const enqueueReportRequestSchema = z.object({
  format: z.enum(['html', 'pdf']).default('html'),
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export const reportDtoSchema = z.object({
  id: z.string().uuid(),
  auditRunId: z.string().uuid(),
  format: z.string(),
  path: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EnqueueReportRequest = z.infer<typeof enqueueReportRequestSchema>;
export type ReportDto = z.infer<typeof reportDtoSchema>;
