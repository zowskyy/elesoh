import { z } from 'zod';

export const businessDtoSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  category: z.string().nullable(),
  phone: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createBusinessRequestSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1).nullable().optional(),
  phone: z.string().min(1).nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
});

export const updateBusinessRequestSchema = z
  .object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).nullable().optional(),
    phone: z.string().min(1).nullable().optional(),
    websiteUrl: z.string().url().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });

export type BusinessDto = z.infer<typeof businessDtoSchema>;
export type CreateBusinessRequest = z.infer<typeof createBusinessRequestSchema>;
export type UpdateBusinessRequest = z.infer<typeof updateBusinessRequestSchema>;
