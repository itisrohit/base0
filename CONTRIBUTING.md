# Contributing to Base0

Thank you for your interest in contributing to Base0. This guide is intended to help you understand the development process, potential areas for contribution, and how to submit successful Pull Requests.

## Understanding the Project

Before contributing, we recommend reviewing the core documentation to understand the project's architecture and future direction:

*   **Project Plan**: See [docs/plan.md](docs/plan.md) for the architectural overview and features.
*   **Future Roadmap**: See [docs/roadmap.md](docs/roadmap.md) for planned phases and upcoming features.

## How Can You Contribute?

We welcome contributions in several forms:

1.  **Reporting Bugs**: If you encounter unintended behavior, please open an Issue describing the reproduction steps.
2.  **Suggesting Features**: Check the Roadmap first. If your idea isn't listed, propose it via an Issue.
3.  **Codebase Improvements**: You can pick up "Good First Issues" or work on roadmap items (Vector DB, Realtime, Enterprise Auth).
4.  **Documentation**: Improving the clarity of our specific guides or inline comments.

## Development Environment

### Prerequisites

*   **Runtime**: Bun (v1.2 or higher)
*   **Container**: Docker (required for the local PostgreSQL instance)

### Setup Instructions

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/itisrohit/base0.git
    cd base0
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    ```

3.  **Configure Environment**:
    ```bash
    cp .env.example .env
    ```

4.  **Start Infrastructure**:
    ```bash
    docker-compose up -d db
    ```

5.  **Initialize Database**:
    ```bash
    bun run db:push
    ```

6.  **Start Development Server**:
    This will start both the API and the Dashboard concurrently:
    ```bash
    bun run dev
    ```
    *   **Dashboard**: http://localhost:5173
    *   **API**: http://localhost:3001

## Operations

We use **Turborepo** to manage tasks across the workspace.

*   `bun run build` - Build all apps and packages.
*   `bun run lint` - Lint all code using Biome.
*   `bun run check` - Run type-checking and linting verification.

## Project Structure

*   `apps/api`: The Hono-based backend core.
*   `apps/dashboard`: The React 19 mission control dashboard.
*   `packages/db`: Shared Drizzle ORM schema and database utilities.

## Pull Request Process

1.  **Fork the Repository**: Create a fork of the repository to your own GitHub account.
2.  **Create a Branch**: Create a new branch from `main` with a descriptive name (e.g., `feat/vector-search` or `fix/auth-bug`).
3.  **Implement Changes**: write your code, ensuring it adheres to the project's coding standards.
4.  **Verify**: Run `bun run check` to ensure your code passes all linting and type-safety checks.
5.  **Commit**: Use Conventional Commits for your messages (e.g., `feat: add realtime websocket server`).
6.  **Submit PR**: Push your branch and open a Pull Request against the `main` branch. Provide a clear description of the changes and link any related issues.

### Pull Request Format

Please copy and paste the following template into your PR description:

```markdown
## Summary
<!-- Explain what this PR does and why it is needed -->

## Type of Change
<!-- Please delete options that are not relevant -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] My changes generate no new linting or build errors
```

## Coding Standards

*   **Strict Typed**: We enforce strict TypeScript configurations. Avoid usage of `any`.
*   **Linter**: We use Biome. Ensure your code is formatted before submission.

