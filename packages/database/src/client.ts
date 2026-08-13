import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';

export type Database = NodePgDatabase<typeof schema>;

export function createPool(databaseUrl: string): pg.Pool {
  return new pg.Pool({ connectionString: databaseUrl });
}

export function createDb(pool: pg.Pool): Database {
  return drizzle(pool, { schema });
}

export async function pingPostgres(pool: pg.Pool): Promise<void> {
  await pool.query('select 1');
}

export { schema };
