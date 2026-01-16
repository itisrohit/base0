<p align="center">
  <img src="assets/banner.png" alt="Base0 Banner" width="100%">
</p>

<p align="center">
  A high-performance, lightweight Backend-as-a-Service (BaaS) built for the edge-native era.
</p>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <img src="https://img.shields.io/badge/runtime-Bun_v1.2-black.svg" alt="Bun">
  <img src="https://img.shields.io/badge/lang-TypeScript-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/framework-Hono-orange.svg" alt="Hono">
  <img src="https://img.shields.io/badge/frontend-React_19-cyan.svg" alt="React">
</p>

<hr />

## Overview

Base0 provides essential backend primitives including authentication, collection-based data storage, and blob storage, all implemented with a zero-trust architecture and type-safe developer experience. It avoids legacy bloat, focusing on minimalist system design and Web Standards compatibility.

## Architecture

The platform is engineered as a monorepo leveraging Bun and Turborepo. It prioritizes:
- **Edge-native compatibility**: Designed to run efficiently on modern runtimes.
- **Type Safety**: End-to-end typing shared between client and server.
- **Minimalism**: Leveraging standard Web APIs (Request/Response) over heavy framework abstractions.

## Core Features

### Authentication
- JWT-based session management with automatic access and refresh token rotation.
- Secure, industry-standard password hashing using Argon2id.
- Passwordless authentication flows using Magic Links.
- Extensible OAuth2 interface supporting providers like GitHub and Google.

### Data Engine
- Dynamic schema definitions utilizing runtime Zod validation.
- Strict multi-tenant isolation via logical project separation.
- Advanced querying capabilities leveraging PostgreSQL JSONB.

### Blob Storage
- Pluggable driver architecture supporting Local filesystem and S3-compatible providers (AWS, MinIO, R2).
- Secure, presigned upload mechanisms and streaming downloads.
- Integrated file metadata tracking and management.

### Access Control
- Granular Role-Based Access Control (RBAC) with Owner, Admin, Member, and Viewer roles.
- Project-scoped API keys with precise permission enforcement.
- Native rate limiting to prevent abuse.

## Technology Stack

- **Runtime**: Bun v1.2+
- **API Framework**: Hono
- **Database**: PostgreSQL with Drizzle ORM
- **Dashboard**: React 19, Vite 6, Tailwind CSS v4
- **Routing**: TanStack Router
- **State Management**: TanStack Query
- **Tooling**: Turborepo, Biome

## Getting Started

### Prerequisites

- **Bun**: v1.2 or higher
- **Docker**: Required for local PostgreSQL instance

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/itisrohit/base0.git
    cd base0
    ```

2.  **Install dependencies**
    ```bash
    bun install
    ```

3.  **Configure environment**
    ```bash
    cp .env.example .env
    ```

4.  **Initialize infrastructure**
    Start the database container and apply schema migrations:
    ```bash
    docker-compose up -d db
    bun run db:push
    ```

### Development

To start the API and Dashboard simultaneously in development mode:

```bash
bun run dev
```

- **API Server**: http://localhost:3001
- **Dashboard**: http://localhost:3000

## Contributing

Please review [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](./LICENSE).
