import {
  createWebsiteRequestSchema,
  updateWebsiteRequestSchema,
} from '@lso/schemas';
import type { AppEnv } from '../env.js';
import type { Hono } from 'hono';
import { toWebsiteDto } from '../mappers.js';

export function registerWebsiteRoutes(app: Hono<AppEnv>): void {
  app.post('/websites', async (c) => {
    const input = createWebsiteRequestSchema.parse(await c.req.json());
    const website = await c.get('websiteService').create(input);
    return c.json(toWebsiteDto(website), 201);
  });

  app.get('/websites', async (c) => {
    const businessId = c.req.query('businessId');
    if (businessId === undefined || businessId === '') {
      return c.json({ error: 'validation_error', message: 'businessId is required' }, 400);
    }
    const websites = await c.get('websiteService').listByBusiness(businessId);
    return c.json(websites.map(toWebsiteDto));
  });

  app.get('/websites/:id', async (c) => {
    const website = await c.get('websiteService').getById(c.req.param('id'));
    return c.json(toWebsiteDto(website));
  });

  app.patch('/websites/:id', async (c) => {
    const input = updateWebsiteRequestSchema.parse(await c.req.json());
    const website = await c.get('websiteService').update(c.req.param('id'), input);
    return c.json(toWebsiteDto(website));
  });

  app.delete('/websites/:id', async (c) => {
    await c.get('websiteService').delete(c.req.param('id'));
    return c.body(null, 204);
  });
}
