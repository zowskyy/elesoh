import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';

export const providerRuns = pgTable('provider_runs', {
  id: idColumn(),
  provider: text('provider').notNull(),
  status: text('status').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  organizationId: uuid('organization_id'),
  ...timestamps,
});
