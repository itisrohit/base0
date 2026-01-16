# Base0

A high-performance, lightweight Backend-as-a-Service (BaaS) built for the edge-native era.

Base0 provides essential backend primitives including authentication, collection-based data storage, and blob storage, all with a zero-trust architecture and type-safe developer experience.

## Architecture

Base0 is built as a monorepo leveraging Bun and Turborepo. It focuses on minimalist system design, using Web Standards (Request/Response) to ensure compatibility across various edge runtimes.

## Core Features

### Authentication
- JWT-based session management with access and refresh tokens.
- Secure password hashing using Argon2id.
- Passwordless login via Magic Links.
- Pluggable OAuth2 interface (GitHub/Google).

### Data Engine
- Dynamic schema definition with runtime Zod validation.
- Multi-tenant isolation through project-based logical separation.
- Advanced querying using PostgreSQL JSONB.

### Blob Storage
- Pluggable driver architecture supporting Local and S3 (AWS/MinIO/R2) storage.
- Secure upload and streaming download.

### Access Control
- Granular Role-Based Access Control (Owner, Admin, Member, Viewer).
- Project-scoped API keys with surgical scope enforcement.
- Integrated rate limiting.

## Technology Stack

- **Server Runtime:** Bun v1.2+
- **API Framework:** Hono
- **Database:** PostgreSQL with Drizzle ORM
- **Dashboard:** React 19, Vite 6, Tailwind CSS v4
- **Routing:** TanStack Router
- **State Management:** TanStack Query
- **Tooling:** Turborepo, Biome

## Getting Started

### Prerequisites

- Bun v1.2 or higher
- Docker (for local PostgreSQL)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/itisrohit/base0.git
   cd base0
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   ```

4. Initialize the database:
   ```bash
   docker compose up -d
   cd packages/db
   bun run db:push
   cd ../..
   ```

### Development

To start the API and Dashboard simultaneously:

```bash
bun run dev
```

- API Server: `http://localhost:3001`
- Dashboard: `http://localhost:3000`

## Repository Structure

The project is organized into logical workspaces:

- `apps/api`: The Hono-based core service.
- `apps/dashboard`: The React-based administrative interface.
- `packages/db`: Shared database schema and Drizzle configuration.

## License

This project is licensed under the [MIT License](./LICENSE).
