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
*   Email + Magic Link / Passwordless (Modern default)
*   Traditional Email/Password (Argon2id)
*   OIDC / OAuth2 Pluggable Interface
*   Rotating JWTs with sliding sessions across edge nodes
*   Turnkey Middleware for route protection

### 2. Data Engine (Collections)
*   Dynamic schema definition
*   High-performance CRUD via JSON methods
*   Filtering engine (eq, lt, gt, contains)
*   Automated `created_at` / `updated_at` traces
*   Optional multi-tenancy (logical isolation)

### 3. Blob Storage
*   S3-compatible interface abstraction
*   Smart metadata tagging
*   Presigned URL generation for direct-to-cloud uploads
*   MIME-type sniffing and strict validation

### 4. Access Control (IAM)
*   Scoped API Keys (Read/Write/Admin)
*   Granular Role-Based Access Control (RBAC)
*   Per-request computational metering (Rate Limiting)

### 5. Mission Control (Dashboard)
*   Visual Data Explorer
*   User & Session Management
*   Storage Browser
*   Real-time usage telemetry

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
*   `id`
*   `key_hash` (never store raw)
*   `project_id`
*   `scopes` (text[])

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

### Phase 2: Core Logic 🚧 IN PROGRESS
*   🔄 Generic Collection CRUD API - **NEXT**
*   Dynamic JSON validation based on collection schema
*   API Key middleware & security headers

### Phase 3: Frontend Implementation
*   React 19 Dashboard setup
*   TanStack Router implementation
*   Data visualization for collections
*   File upload widgets

### Phase 4: Refinement & QA
*   Docs generation (OpenAPI/Swagger)
*   Integration tests (Vitest)
*   Docker Compose production readiness checks

---

## Definition of Done

*   **Deployable**: Single `docker compose up` starts the world.
*   **Performant**: Sub-50ms response times for core reads.
*   **Secure**: Passes standard OWASP validation checks.
*   **Observable**: Structured logging is implemented.
