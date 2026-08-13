import { doublePrecision, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './columns.js';
import { organizations } from './organizations.js';

export const businesses = pgTable('businesses', {
  id: idColumn(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  name: text('name').notNull(),
  category: text('category'),
  phone: text('phone'),
  websiteUrl: text('website_url'),
  ...timestamps,
});

export const businessLocations = pgTable('business_locations', {
  id: idColumn(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  address: text('address'),
  city: text('city'),
  region: text('region'),
  postalCode: text('postal_code'),
  country: text('country'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  ...timestamps,
});
