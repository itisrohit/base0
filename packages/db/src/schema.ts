import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'), // Nullable for passwordless/OAuth users
    mfaEnabled: boolean('mfa_enabled').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const projects = pgTable('projects', {
    id: text('id').primaryKey(), // nanoid
    name: text('name').notNull(),
    ownerId: uuid('owner_id').references(() => users.id),
    config: jsonb('config').default({}),
    createdAt: timestamp('created_at').defaultNow(),
});

export const projectMembers = pgTable('project_members', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // 'owner', 'admin', 'member', 'viewer'
    createdAt: timestamp('created_at').defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(), // User-friendly name
    keyId: text('key_id').notNull().unique(), // Public part for lookup
    keyHash: text('key_hash').notNull(), // Hashed secret
    projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    scopes: text('scopes').array(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const collections = pgTable('collections', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    schemaDef: jsonb('schema_def').notNull(),
    permissions: jsonb('permissions').default({}),
});

export const documents = pgTable('documents', {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }),
    data: jsonb('data').notNull(),
    vectorEmbedding: text('vector_embedding'), // placeholder for pgvector
    createdAt: timestamp('created_at').defaultNow(),
});

export const buckets = pgTable('buckets', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    enabled: boolean('enabled').default(true),
    maxFileSize: text('max_file_size'), // e.g. "10MB"
    allowedExtensions: text('allowed_extensions').array(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const files = pgTable('files', {
    id: uuid('id').primaryKey().defaultRandom(),
    bucketId: uuid('bucket_id').references(() => buckets.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    size: text('size').notNull(), // bytes as string to avoid bigint overflow in some JS environments
    mimeType: text('mime_type').notNull(),
    path: text('path').notNull(), // Internal storage path
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow(),
});

export const magicLinks = pgTable('magic_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenHash: text('token_hash').notNull().unique(),
    userEmail: text('user_email').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    used: boolean('used').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const oauthAccounts = pgTable('oauth_accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull(), // 'github', 'google'
    providerUserId: text('provider_user_id').notNull(),
    userId: uuid('user_id')
        .references(() => users.id)
        .notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});
