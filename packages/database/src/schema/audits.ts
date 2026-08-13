import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { websites } from './websites.js';

export const auditRuns = pgTable('audit_runs', {
  id: idColumn(),
  websiteId: uuid('website_id')
    .notNull()
    .references(() => websites.id),
  status: text('status').notNull().default('queued'),
  version: text('version').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps,
});
