import { pgTable, text } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';

export const users = pgTable('users', {
  id: idColumn(),
  email: text('email').notNull().unique(),
  ...timestamps,
});
