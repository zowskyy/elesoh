import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { auditRuns } from './audits.js';
import { evidence } from './evidence.js';

export const findings = pgTable('findings', {
  id: idColumn(),
  auditRunId: uuid('audit_run_id')
    .notNull()
    .references(() => auditRuns.id),
  evidenceId: uuid('evidence_id')
    .notNull()
    .references(() => evidence.id),
  ruleId: text('rule_id').notNull(),
  outcome: text('outcome').notNull(),
  summary: text('summary').notNull(),
  ...timestamps,
});
