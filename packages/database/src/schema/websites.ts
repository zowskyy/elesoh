import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { businesses } from './businesses.js';

export const websites = pgTable('websites', {
  id: idColumn(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  url: text('url').notNull(),
  ...timestamps,
});
