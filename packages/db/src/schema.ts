import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  mfaEnabled: boolean('mfa_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey(), // nanoid
  name: text('name').notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  config: jsonb('config').default({}),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  keyHash: text('key_hash').notNull(),
  projectId: text('project_id').references(() => projects.id),
  scopes: text('scopes').array(),
});

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: text('project_id').references(() => projects.id),
  schemaDef: jsonb('schema_def').notNull(),
  permissions: jsonb('permissions').default({}),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id').references(() => collections.id),
  data: jsonb('data').notNull(),
  vectorEmbedding: text('vector_embedding'), // placeholder for pgvector
  createdAt: timestamp('created_at').defaultNow(),
});
