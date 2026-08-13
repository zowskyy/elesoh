import { z } from 'zod';

export const dependencyStatusSchema = z.object({
  status: z.enum(['ok', 'error']),
  message: z.string().optional(),
});

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  service: z.literal('api'),
  version: z.string(),
  startedAt: z.string(),
  dependencies: z.object({
    postgres: dependencyStatusSchema,
    redis: dependencyStatusSchema,
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
