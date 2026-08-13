import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { findings } from './findings.js';

export const recommendations = pgTable('recommendations', {
  id: idColumn(),
  findingId: uuid('finding_id')
    .notNull()
    .references(() => findings.id),
  priority: text('priority').notNull(),
  action: text('action').notNull(),
  ...timestamps,
});
