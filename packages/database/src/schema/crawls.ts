import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { websites } from './websites.js';

export const crawls = pgTable('crawls', {
  id: idColumn(),
  websiteId: uuid('website_id')
    .notNull()
    .references(() => websites.id),
  status: text('status').notNull().default('queued'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps,
});

export const pages = pgTable('pages', {
  id: idColumn(),
  crawlId: uuid('crawl_id')
    .notNull()
    .references(() => crawls.id),
  url: text('url').notNull(),
  statusCode: integer('status_code'),
  contentType: text('content_type'),
  ...timestamps,
});

export const pageLinks = pgTable('page_links', {
  id: idColumn(),
  pageId: uuid('page_id')
    .notNull()
    .references(() => pages.id),
  href: text('href').notNull(),
  rel: text('rel'),
  ...timestamps,
});

export const pageImages = pgTable('page_images', {
  id: idColumn(),
  pageId: uuid('page_id')
    .notNull()
    .references(() => pages.id),
  src: text('src').notNull(),
  alt: text('alt'),
  ...timestamps,
});

export const pageHeadings = pgTable('page_headings', {
  id: idColumn(),
  pageId: uuid('page_id')
    .notNull()
    .references(() => pages.id),
  level: integer('level').notNull(),
  text: text('text').notNull(),
  ...timestamps,
});

export const pageStructuredData = pgTable('page_structured_data', {
  id: idColumn(),
  pageId: uuid('page_id')
    .notNull()
    .references(() => pages.id),
  format: text('format').notNull(),
  data: text('data').notNull(),
  ...timestamps,
});
