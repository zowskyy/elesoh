import { integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { idColumn } from './columns.js';

export const jobs = pgTable(
  'jobs',
  {
    id: idColumn(),
    type: text('type').notNull(),
    status: text('status').notNull(),
    idempotencyKey: text('idempotency_key'),
    payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    error: text('error'),
  },
  (table) => [
    uniqueIndex('jobs_idempotency_key_uidx')
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);
