import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadEnv } from '@lso/config';
import { createDb, createPool } from './client.js';

const env = loadEnv();
const pool = createPool(env.DATABASE_URL);
const db = createDb(pool);
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '../drizzle');

await migrate(db, { migrationsFolder });
await pool.end();
