import { defineConfig } from 'drizzle-kit';
import { loadEnv } from '@lso/config';

// drizzle-kit CLI only. Application code uses packages/config exclusively.
const env = loadEnv();

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
