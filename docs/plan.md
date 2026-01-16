# Base0 — Next-Gen Lightweight BaaS

## Vision

Build a **hyper-efficient Backend-as-a-Service (BaaS)** that provides the **essential backend primitives**—authentication, database, file storage, and access control—in a package that is **edge-native, type-safe, and instantly deployable**.

Base0 avoids the bloat of legacy platforms. It is designed for the **AI-first era**, where speed, context-window efficiency (readable code), and standard web APIs are paramount.

This project demonstrates:
*   **Edge-First Architecture**: Systems designed to run on Bun, Workers, or Deno.
*   **End-to-End Type Safety**: 100% shared types between client and server.
*   **Minimalist System Design**: High leverage with zero "magic".

Target audience: **Senior engineers & modern product teams**.

---

## Design Philosophy

*   **Subtract to Scale**: Every feature added is a debt. We fixate on the primitives.
*   **Standards over Frameworks**: Use Web Standards (Request/Response) everywhere.
*   **Type-Safe or Bust**: If it's not typed, it doesn't exist.
*   **Local-First DX**: The dev environment matches production perfectly.
*   **AI-Ready Codebase**: Code is structured to be easily parsed and extended by LLMs.

---

## Core Features (v1)

### 1. Authentication (Zero-Trust)
*   ✅ **Traditional Email/Password (Argon2id)** - Implemented
*   ✅ **JWT Sessions** - Implemented with Access/Refresh tokens
*   ✅ **Auth Middleware** - Implemented for route protection
*   🔄 Magic Link / Passwordless - Planned
*   🔄 OIDC / OAuth2 Pluggable Interface - Planned

### 2. Data Engine (Collections)
*   ✅ **Dynamic Schema Definition** - Implemented via JSONB
*   ✅ **Dynamic Validation** - Implemented with runtime Zod engine
*   ✅ **CRUD API** - Implemented for Collections and Documents
*   ✅ **Multi-tenancy** - Implemented via Projects logical isolation
*   ✅ **Filtering Engine (eq, lt, gt, contains)** - Implemented with PostgreSQL JSONB

### 3. Blob Storage
*   ✅ **Pluggable Architecture** - Implemented (Local/S3 Abstraction)
*   ✅ **File Metadata & Tracking** - Implemented in database
*   ✅ **Secure Upload/Download** - Implemented with stream support

### 4. Access Control (IAM)
*   ✅ **API Key Provisioning** - Implemented
*   ✅ **Unified Auth Middleware** - Implemented (JWT + API Key support)
*   🔄 Scoped Permissions (RBAC) - In Progress (Schema Ready)
*   🔄 Rate Limiting - Planned

### 5. Mission Control (Dashboard)
*   🔄 Visual Data Explorer - Planned (Phase 3)
*   🔄 User & Session Management - Planned
*   🔄 Storage Browser - Planned
*   🔄 Usage Telemetry - Planned

---

## The Tech Stack

### Backend (The "Edge" Core)
*   **Runtime**: [Bun v1.2+](https://bun.sh) (Native TypeScript, localized SQLite)
*   **Framework**: [Hono](https://hono.dev) (Ultrafast, Web Standards based, runs anywhere)
*   **Database**: [PostgreSQL 18](https://www.postgresql.org) (Production) / **LibSQL** (Edge)
*   **ORM**: [Drizzle ORM](https://orm.drizzle.team) (Zero runtime overhead, SQL-like)
*   **Validation**: [Zod](https://zod.dev) (Runtime schema validation)

### Frontend (The "Compiler" Era)
*   **Framework**: [React 19](https://react.dev) (w/ React Compiler for auto-memoization)
*   **Build Tool**: [Vite 6](https://vitejs.dev) (Instant HMR)
*   **Routing**: [TanStack Router](https://tanstack.com/router) (100% type-safe routing)
*   **State**: [TanStack Query](https://tanstack.com/query) (Async state management)
*   **System**: [Tailwind CSS v4](https://tailwindcss.com) (Oxidized, zero-runtime)
*   **UI Kit**: [shadcn/ui](https://ui.shadcn.com) (Radix primitives)

### Infrastructure & Ops
*   **Container**: Docker (Distroless images)
*   **CI/CD**: GitHub Actions
*   **DevOps**: Biome (Formatter/Linter - Rust based)

---

## Operations & Schema

### Database Schema (v1 Draft)

#### `users`
*   `id` (uuid v7 - time sortable)
*   `email` (index)
*   `password_hash`
*   `mfa_enabled` (boolean)
*   `created_at`

#### `projects`
*   `id` (nanoId)
*   `name`
*   `owner_id` (fk -> users)
*   `config` (jsonb)

#### `api_keys`
*   `id` (uuid)
*   `key_id` (nanoId - public identifier)
*   `key_hash` (argon2 hashed secret)
*   `project_id`
*   `scopes` (text[])

#### `project_members`
*   `id` (uuid)
*   `project_id`
*   `user_id`
*   `role` (owner, admin, member, viewer)

#### `collections`
*   `id`
*   `project_id`
*   `schema_def` (jsonb - stores field types)
*   `permissions` (jsonb)

#### `documents`
*   `id`
*   `collection_id`
*   `data` (jsonb)
*   `vector_embedding` (optional, for AI search)
*   `created_at`

#### `buckets`
*   `id` (uuid)
*   `project_id`
*   `name`
*   `config` (jsonb)

#### `files`
*   `id` (uuid)
*   `bucket_id`
*   `name`
*   `path` (storage path)
*   `size`
*   `mime_type`

---

## Development Roadmap

### Phase 1: Foundation ✅ COMPLETED
*   ✅ Initialize Monorepo (Turborepo)
*   ✅ Setup Bun + Hono structure
*   ✅ Implement Zod schemas & Drizzle migrations
*   ✅ PostgreSQL 18 with Docker Compose
*   ✅ Database schema pushed and verified
*   ✅ Basic Auth flows (SignUp / SignIn)

**Completed Items:**
- Turborepo monorepo with Bun package manager
- Biome for linting/formatting (Rust-based, ultra-fast)
- TypeScript configuration across all workspaces
- `@base0/db` package with Drizzle ORM + PostgreSQL
- `@base0/api` with Hono framework on Bun runtime
- `@base0/dashboard` with React 19, Vite 6, Tailwind CSS v4
- Docker Compose for local PostgreSQL
- Comprehensive database documentation
- **Authentication System:**
  - Argon2id password hashing (Bun built-in)
  - JWT access & refresh tokens
  - Auth middleware for route protection
  - Auth routes: signup, login, refresh, me
  - Zod validation for all inputs

### Phase 3: Extended Primitives ✅ COMPLETED (Core)
*   ✅ **Unified Auth Middleware**: Support for both JWT (User Sessions) and API Keys (b0_...) - Implemented
*   ✅ **Document Filtering Engine**: Advanced JSONB querying with operators (`eq`, `gt`, `contains`, `in`, etc.) - Implemented
*   ✅ **Blob Storage System**: Plug-and-play storage architecture with Local driver support - Implemented
*   ✅ **File Storage API**: Secure bucket management, file uploads (with metadata), and streaming downloads - Implemented
*   ✅ **Permissions Foundation**: Schema support for multi-member projects and RBAC - Implemented

**Next focus: Refinement & Scoped Permissions**
- **Scoped RBAC**: Enforcing granular roles (Owner, Admin, Member, Viewer)
- **API Key Scopes**: Restricting keys to specific operations (Read-only, Write-only)
- **Member Management**: Invite/Remove flow for projects
- **S3 Storage Driver**: AWS S3/Minio compatibility layer
- **Rate Limiting**: Base computational metering per project/key

### Phase 4: Mission Control (Frontend)
*   React 19 Dashboard setup
*   TanStack Router implementation
*   Schema Designer (Visual UI for collections)
*   Visual Data Explorer
*   API Key Management UI

### Phase 5: Refinement & QA
*   OpenAPI / Swagger documentation auto-generation
*   Integration tests (Vitest)
*   Docker Compose production readiness checks (SSL, persistence)
*   Deployment guides (Fly.io / Vercel / Railway)

---

## Definition of Done

*   **Deployable**: Single `docker compose up` starts the world.
*   **Performant**: Sub-50ms response times for core reads.
*   **Secure**: Passes standard OWASP validation checks.
*   **Observable**: Structured logging is implemented.
