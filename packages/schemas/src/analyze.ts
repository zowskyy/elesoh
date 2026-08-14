import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  url: z.string().min(1).max(2000),
  businessName: z.string().min(1).max(200).optional(),
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
