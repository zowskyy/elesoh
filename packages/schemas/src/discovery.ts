import { z } from 'zod';

const discoveredBusinessSchema = z.object({
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  externalId: z.string().nullable().optional(),
});

export const enqueueDiscoveryRequestSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('imported'),
    businesses: z.array(discoveredBusinessSchema).min(1).max(200),
    idempotencyKey: z.string().min(1).max(200).optional(),
  }),
  z.object({
    provider: z.literal('osm'),
    city: z.string().min(1),
    category: z.string().min(1).optional(),
    limit: z.number().int().positive().max(50).optional(),
    idempotencyKey: z.string().min(1).max(200).optional(),
  }),
]);

export const opportunityDtoSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string(),
  websiteUrl: z.string().nullable(),
  opportunityScore: z.number(),
  auditScore: z.number().nullable(),
  reason: z.string(),
});

export const providerRunDtoSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  status: z.string(),
  payload: z.record(z.unknown()).nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EnqueueDiscoveryRequest = z.infer<typeof enqueueDiscoveryRequestSchema>;
export type OpportunityDto = z.infer<typeof opportunityDtoSchema>;
export type ProviderRunDto = z.infer<typeof providerRunDtoSchema>;
