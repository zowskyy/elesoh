import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { users } from './users.js';

export const organizations = pgTable('organizations', {
  id: idColumn(),
  name: text('name').notNull(),
  ...timestamps,
});

export const organizationMembers = pgTable(
  'organization_members',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role').notNull().default('member'),
    ...timestamps,
  },
  (table) => [unique().on(table.organizationId, table.userId)],
);
