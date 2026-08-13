import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { pages } from './crawls.js';

export const evidence = pgTable('evidence', {
  id: idColumn(),
  pageId: uuid('page_id')
    .notNull()
    .references(() => pages.id),
  kind: text('kind').notNull(),
  data: jsonb('data').notNull().$type<Record<string, unknown>>(),
  ...timestamps,
});
