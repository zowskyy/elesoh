import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { auditRuns } from './audits.js';

export const reports = pgTable('reports', {
  id: idColumn(),
  auditRunId: uuid('audit_run_id')
    .notNull()
    .references(() => auditRuns.id),
  format: text('format').notNull(),
  path: text('path').notNull(),
  ...timestamps,
});
