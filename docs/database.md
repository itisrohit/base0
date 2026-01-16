# Database Architecture

## Overview

Base0 uses **PostgreSQL 18** with **Drizzle ORM** for type-safe database operations. This setup provides:

- **Type Safety**: Full TypeScript types generated from schema
- **Zero Runtime Overhead**: Drizzle compiles to raw SQL
- **Developer Experience**: SQL-like syntax with autocomplete
- **Migration Management**: Version-controlled schema changes

---

## Schema Design

### Core Principles

1. **Multi-Tenancy Ready**: Projects isolate data per user/organization
2. **JSONB for Flexibility**: Dynamic schemas stored as JSON
3. **UUID v7 for IDs**: Time-sortable, globally unique identifiers
4. **Audit Trails**: Automatic `created_at` timestamps

---

## Tables

### 1. `users`
Stores user accounts and authentication data.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features:**
- Email-based authentication
- Password hashing (Argon2id in application layer)
- MFA support flag for future implementation
- Indexed email for fast lookups

---

### 2. `projects`
Logical containers for isolating resources (multi-tenancy).

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,  -- nanoid for short, URL-safe IDs
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  config JSONB DEFAULT '{}'
);
```

**Key Features:**
- Uses nanoid for human-readable IDs (e.g., `proj_abc123`)
- JSONB config for flexible project settings
- Owner relationship for access control

**Use Case:**
Each user can create multiple projects. All resources (collections, files, API keys) belong to a project.

---

### 3. `api_keys`
Scoped authentication tokens for programmatic access.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id),
  scopes TEXT[]
);
```

**Key Features:**
- Hashed keys (never store raw keys)
- Array of scopes for granular permissions
- Project-scoped for isolation

**Scopes:**
- `read`: Read-only access
- `write`: Create/update operations
- `delete`: Deletion permissions
- `admin`: Full project access

---

### 4. `collections`
Schema definitions for dynamic data storage.

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id),
  schema_def JSONB NOT NULL,
  permissions JSONB DEFAULT '{}'
);
```

**Key Features:**
- Dynamic schema stored as JSONB
- Runtime validation using Zod
- Flexible permissions model

**Schema Definition Example:**
```json
{
  "name": "users",
  "fields": [
    { "key": "name", "type": "string", "required": true },
    { "key": "age", "type": "number", "required": false },
    { "key": "email", "type": "email", "required": true }
  ]
}
```

---

### 5. `documents`
Actual data storage for collections.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id),
  data JSONB NOT NULL,
  vector_embedding TEXT,  -- Future: pgvector for AI search
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features:**
- JSONB for schemaless storage
- Indexed for fast queries
- Optional vector embeddings for semantic search

**Why JSONB?**
- Flexible: No schema migrations for new fields
- Fast: Binary format with indexing support
- Queryable: PostgreSQL JSONB operators (`->`, `->>`, `@>`)

---

## Why This Architecture?

### 1. **Flexibility Without Chaos**
- Collections define schemas, but storage is JSONB
- Best of both worlds: structure + flexibility
- Runtime validation ensures data integrity

### 2. **Multi-Tenancy by Design**
- Projects isolate all resources
- No cross-project data leakage
- Easy to implement row-level security (RLS)

### 3. **Performance**
- PostgreSQL JSONB is indexed and fast
- UUID v7 provides natural time-based sorting
- Drizzle generates optimized SQL

### 4. **Developer Experience**
- Type-safe queries with autocomplete
- No ORM magic, just SQL
- Easy to debug and optimize

---

## Database Operations

### Pushing Schema Changes

```bash
cd packages/db
bun run db:push
```

This command:
1. Reads `schema.ts`
2. Compares with current database state
3. Generates and applies SQL migrations
4. Updates TypeScript types

### Generating Migrations

```bash
cd packages/db
bun run db:generate
```

Creates migration files in `drizzle/` for version control.

### Running Migrations

```bash
cd packages/db
bun run db:migrate
```

Applies pending migrations to the database.

### Database Studio (GUI)

```bash
cd packages/db
bun run db:studio
```

Opens Drizzle Studio at `https://local.drizzle.studio` for visual database management.

---

## Example Queries

### Creating a User

```typescript
import { db } from '@base0/db';
import { users } from '@base0/db/schema';

const newUser = await db.insert(users).values({
  email: 'user@example.com',
  passwordHash: await hashPassword('password123'),
}).returning();
```

### Querying Documents

```typescript
import { db } from '@base0/db';
import { documents } from '@base0/db/schema';
import { eq } from 'drizzle-orm';

const userDocs = await db
  .select()
  .from(documents)
  .where(eq(documents.collectionId, collectionId));
```

### JSONB Queries

```typescript
import { sql } from 'drizzle-orm';

// Find documents where data.age > 18
const adults = await db
  .select()
  .from(documents)
  .where(sql`${documents.data}->>'age' > '18'`);
```

---

## Future Enhancements

### 1. **Vector Search (pgvector)**
Add semantic search capabilities:
```sql
CREATE EXTENSION vector;
ALTER TABLE documents ADD COLUMN embedding vector(1536);
```

### 2. **Row-Level Security (RLS)**
PostgreSQL policies for multi-tenancy:
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_isolation ON documents
  USING (collection_id IN (
    SELECT id FROM collections WHERE project_id = current_setting('app.project_id')
  ));
```

### 3. **Audit Logs**
Track all data changes:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  table_name TEXT,
  operation TEXT,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Troubleshooting

### Reset Database

```bash
docker compose down -v
docker compose up -d
cd packages/db && bun run db:push
```

### View Logs

```bash
docker logs base0-postgres
```

### Connect with psql

```bash
docker exec -it base0-postgres psql -U postgres -d base0
```

### Check Table Structure

```sql
\d users
\d+ documents  -- with indexes and constraints
```

---

## Performance Tips

1. **Index JSONB Fields**
   ```sql
   CREATE INDEX idx_user_email ON documents USING GIN ((data->'email'));
   ```

2. **Use Prepared Statements**
   Drizzle automatically uses prepared statements for security and performance.

3. **Batch Operations**
   ```typescript
   await db.insert(documents).values([doc1, doc2, doc3]);
   ```

4. **Connection Pooling**
   Already configured in `packages/db/src/index.ts` via postgres.js.

---

## Security Considerations

1. **Never Store Raw API Keys**: Always hash before storing
2. **Use Parameterized Queries**: Drizzle handles this automatically
3. **Enable SSL in Production**: Update `DATABASE_URL` with `?sslmode=require`
4. **Implement RLS**: For true multi-tenant isolation
5. **Regular Backups**: Use `pg_dump` or managed PostgreSQL services

---

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [pgvector Extension](https://github.com/pgvector/pgvector)
- [UUID v7 Spec](https://datatracker.ietf.org/doc/html/draft-peabody-dispatch-new-uuid-format)
