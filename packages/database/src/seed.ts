import { DEFAULT_ORGANIZATION_ID } from '@lso/domain';
import { loadEnv } from '@lso/config';
import { eq } from 'drizzle-orm';
import { createDb, createPool } from './client.js';
import { organizations } from './schema/organizations.js';

const env = loadEnv();
const pool = createPool(env.DATABASE_URL);
const db = createDb(pool);

const existing = await db
  .select({ id: organizations.id })
  .from(organizations)
  .where(eq(organizations.id, DEFAULT_ORGANIZATION_ID))
  .limit(1);

if (existing[0] === undefined) {
  await db.insert(organizations).values({
    id: DEFAULT_ORGANIZATION_ID,
    name: 'Local Development',
  });
}

await pool.end();
