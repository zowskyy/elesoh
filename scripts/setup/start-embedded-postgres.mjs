import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const databaseDir = join(process.cwd(), 'data', 'pg');
mkdirSync(databaseDir, { recursive: true });

const alreadyInitialized = existsSync(join(databaseDir, 'PG_VERSION'));
if (!alreadyInitialized && existsSync(databaseDir)) {
  // Clear a failed partial init so initdb can run cleanly.
  const entries = existsSync(databaseDir);
  if (entries && !alreadyInitialized) {
    rmSync(databaseDir, { recursive: true, force: true });
    mkdirSync(databaseDir, { recursive: true });
  }
}

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'lso',
  password: 'lso',
  port: 5432,
  persistent: true,
});

if (!existsSync(join(databaseDir, 'PG_VERSION'))) {
  await pg.initialise();
}

await pg.start();

try {
  await pg.createDatabase('lso');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.toLowerCase().includes('already exists')) {
    throw error;
  }
}

console.log('embedded postgres ready on postgres://lso:lso@localhost:5432/lso');

await new Promise(() => {
  /* keep process alive */
});
