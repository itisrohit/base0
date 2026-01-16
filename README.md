# Base0 Development Guide

## Prerequisites

- [Bun](https://bun.sh) v1.2+
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Git](https://git-scm.com/)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/itisrohit/base0.git
cd base0
bun install
```

### 2. Start Database

```bash
docker compose up -d
```

### 3. Setup Environment

```bash
cp .env.example .env
```

### 4. Run Database Migrations

```bash
cd packages/db
bun run db:push
cd ../..
```

This will create all the necessary tables in your PostgreSQL database.

### 5. Start Development Servers

```bash
# From root directory
bun run dev
```

This will start:
- **API Server**: http://localhost:3001
- **Dashboard**: http://localhost:3000

## Available Scripts

### Root Level
- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all apps
- `bun run type-check` - Run TypeScript checks
- `bun run check` - Run Biome linter
- `bun run check:apply` - Auto-fix linting issues

### Database (`packages/db`)
- `bun run db:generate` - Generate migrations from schema
- `bun run db:push` - Push schema changes to database
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Drizzle Studio

### API (`apps/api`)
- `bun run dev` - Start API server with hot reload
- `bun run build` - Build for production

### Dashboard (`apps/dashboard`)
- `bun run dev` - Start Vite dev server
- `bun run build` - Build for production

## Project Structure

```
base0/
├── apps/
│   ├── api/          # Hono API server (Bun runtime)
│   └── dashboard/    # React 19 + Vite dashboard
├── packages/
│   └── db/           # Drizzle ORM + PostgreSQL schema
├── docs/
│   └── plan.md       # Project roadmap
└── docker-compose.yml
```

## Tech Stack

- **Runtime**: Bun
- **API**: Hono
- **Database**: PostgreSQL 18 + Drizzle ORM
- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4
- **Monorepo**: Turborepo
- **Linting**: Biome

## Database Management

### View Database in Drizzle Studio
```bash
cd packages/db
bun run db:studio
```

### Reset Database
```bash
docker compose down -v
docker compose up -d
cd packages/db
bun run db:push
```

## License

MIT
