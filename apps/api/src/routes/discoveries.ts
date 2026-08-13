import { enqueueDiscoveryRequestSchema } from '@lso/schemas';
import type { Hono } from 'hono';
import type { AppEnv } from '../env.js';
import { toJobDto, toOpportunityDto, toProviderRunDto } from '../mappers.js';

export function registerDiscoveryRoutes(app: Hono<AppEnv>): void {
  app.post('/discoveries', async (c) => {
    const body = enqueueDiscoveryRequestSchema.parse(await c.req.json());
    const query =
      body.provider === 'imported'
        ? {
            provider: 'imported' as const,
            imported: body.businesses.map((row) => ({
              name: row.name,
              category: row.category ?? null,
              phone: row.phone ?? null,
              websiteUrl: row.websiteUrl ?? null,
              address: row.address ?? null,
              city: row.city ?? null,
              region: row.region ?? null,
              postalCode: row.postalCode ?? null,
              country: row.country ?? null,
              latitude: row.latitude ?? null,
              longitude: row.longitude ?? null,
              source: 'imported' as const,
              externalId: row.externalId ?? null,
            })),
          }
        : {
            provider: 'osm' as const,
            osm: {
              city: body.city,
              ...(body.category !== undefined ? { category: body.category } : {}),
              ...(body.limit !== undefined ? { limit: body.limit } : {}),
            },
          };

    const result = await c.get('discoveryService').enqueueDiscover(
      query,
      body.idempotencyKey === undefined ? undefined : body.idempotencyKey,
    );
    return c.json(
      {
        job: toJobDto(result.job),
        providerRunId: result.providerRunId,
        created: result.created,
      },
      result.created ? 202 : 200,
    );
  });

  app.get('/discoveries/:id', async (c) => {
    const run = await c.get('discoveryService').getProviderRun(c.req.param('id'));
    return c.json(toProviderRunDto(run));
  });

  app.get('/opportunities', async (c) => {
    const rows = await c.get('discoveryService').listOpportunities();
    return c.json(rows.map(toOpportunityDto));
  });
}
