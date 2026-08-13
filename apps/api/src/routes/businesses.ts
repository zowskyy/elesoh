import {
  createBusinessRequestSchema,
  updateBusinessRequestSchema,
} from '@lso/schemas';
import type { AppEnv } from '../env.js';
import type { Hono } from 'hono';
import { toBusinessDto } from '../mappers.js';

export function registerBusinessRoutes(app: Hono<AppEnv>): void {
  app.post('/businesses', async (c) => {
    const input = createBusinessRequestSchema.parse(await c.req.json());
    const business = await c.get('businessService').create({
      name: input.name,
      category: input.category ?? null,
      phone: input.phone ?? null,
      websiteUrl: input.websiteUrl ?? null,
    });
    return c.json(toBusinessDto(business), 201);
  });

  app.get('/businesses', async (c) => {
    const businesses = await c.get('businessService').list();
    return c.json(businesses.map(toBusinessDto));
  });

  app.get('/businesses/:id', async (c) => {
    const business = await c.get('businessService').getById(c.req.param('id'));
    return c.json(toBusinessDto(business));
  });

  app.patch('/businesses/:id', async (c) => {
    const input = updateBusinessRequestSchema.parse(await c.req.json());
    const patch: {
      name?: string;
      category?: string | null;
      phone?: string | null;
      websiteUrl?: string | null;
    } = {};
    if (input.name !== undefined) {
      patch.name = input.name;
    }
    if (input.category !== undefined) {
      patch.category = input.category;
    }
    if (input.phone !== undefined) {
      patch.phone = input.phone;
    }
    if (input.websiteUrl !== undefined) {
      patch.websiteUrl = input.websiteUrl;
    }
    const business = await c.get('businessService').update(c.req.param('id'), patch);
    return c.json(toBusinessDto(business));
  });

  app.delete('/businesses/:id', async (c) => {
    await c.get('businessService').delete(c.req.param('id'));
    return c.body(null, 204);
  });
}
