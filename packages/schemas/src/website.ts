import { z } from 'zod';

export const websiteDtoSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  url: z.string().url(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createWebsiteRequestSchema = z.object({
  businessId: z.string().uuid(),
  url: z.string().url(),
});

export const updateWebsiteRequestSchema = z.object({
  url: z.string().url(),
});

export type WebsiteDto = z.infer<typeof websiteDtoSchema>;
export type CreateWebsiteRequest = z.infer<typeof createWebsiteRequestSchema>;
export type UpdateWebsiteRequest = z.infer<typeof updateWebsiteRequestSchema>;
