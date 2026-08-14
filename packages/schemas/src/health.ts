import { z } from 'zod';

export const dependencyStatusSchema = z.object({
  status: z.enum(['ok', 'error']),
  message: z.string().optional(),
});

export const healthDependenciesSchema = z.object({
  postgres: dependencyStatusSchema,
  redis: dependencyStatusSchema,
});

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  service: z.literal('api'),
  version: z.string(),
  startedAt: z.string(),
  dependencies: healthDependenciesSchema,
});

export const liveHealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
});

export const readyHealthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  service: z.literal('api'),
  dependencies: healthDependenciesSchema,
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type LiveHealthResponse = z.infer<typeof liveHealthResponseSchema>;
export type ReadyHealthResponse = z.infer<typeof readyHealthResponseSchema>;
