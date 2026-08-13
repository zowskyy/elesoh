import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { websites } from './websites.js';
import { crawls } from './crawls.js';

export const auditRuns = pgTable('audit_runs', {
  id: idColumn(),
  websiteId: uuid('website_id')
    .notNull()
    .references(() => websites.id),
  crawlId: uuid('crawl_id').references(() => crawls.id),
  mode: text('mode').notNull().default('seo'),
  status: text('status').notNull().default('queued'),
  version: text('version').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps,
});

export const auditScores = pgTable('audit_scores', {
  id: idColumn(),
  auditRunId: uuid('audit_run_id')
    .notNull()
    .unique()
    .references(() => auditRuns.id),
  overall: integer('overall').notNull(),
  seo: integer('seo').notNull(),
  performance: integer('performance'),
  categories: jsonb('categories').notNull().$type<Record<string, number>>(),
  ...timestamps,
});
