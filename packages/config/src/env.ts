import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { envSchema, type Env } from './schema.js';

function findEnvFile(): string | undefined {
  const start = dirname(fileURLToPath(import.meta.url));
  let current = start;
  for (let i = 0; i < 8; i += 1) {
    const candidate = join(current, '.env');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = resolve(current, '..');
    if (parent === current) {
      break;
    }
    current = parent;
  }
  const cwdCandidate = join(process.cwd(), '.env');
  return existsSync(cwdCandidate) ? cwdCandidate : undefined;
}

const envPath = findEnvFile();
if (envPath !== undefined) {
  loadDotenv({ path: envPath });
} else {
  loadDotenv();
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  return envSchema.parse(source);
}

export function loadEnv(): Env {
  return parseEnv(process.env);
}
