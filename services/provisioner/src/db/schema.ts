import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const workers = pgTable('workers', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: text('device_id').notNull().unique(),
  workerType: text('worker_type').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const provisionLogs = pgTable('provision_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jwtToken: text('jwt_token').notNull(),
  packageSlug: text('package_slug').notNull(),
  installationDate: timestamp('installation_date').defaultNow().notNull(),
});
