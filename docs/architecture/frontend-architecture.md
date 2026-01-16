# Mission Control (Frontend) Architecture

## Overview
This document outlines the high-level architecture and strategic design decisions for "Mission Control," the frontend dashboard for the Base0 platform. The dashboard serves as the command center for users to manage their projects, data, and access controls.

**Core Philosophy:**
- **Type Safety First**: End-to-end type safety is non-negotiable, extending from the routing layer down to API responses.
- **Premium Aesthetics**: A "Dark Mode by Default" design language that feels professional, responsive, and modern.
- **Performance**: Architecture optimized for instant page loads (SPA), optimistic UI updates, and aggressive caching.

## Technology Stack & Rationale
We selected the **2026 Modern Standard** stack to ensure longevity and developer velocity:

- **React 19 + Vite 6**: Chosen for the new concurrent rendering features and lightning-fast HMR (Hot Module Replacement).
- **@tanstack/react-router**: Selected over traditional routers for its first-class TypeScript support and search-param state management.
- **@tanstack/react-query**: Utilized to treat "server state" (API data) differently from "client state" (UI toggles), eliminating complex global state stores.
- **Shadcn UI + Tailwind CSS v4**: Provides a copy-paste component architecture that allows full customization without fighting a framework's abstraction.

## Authentication Strategy
We implement a **Hybrid Authentication Pattern** that balances security with user experience:

1.  **Transport Security**: We rely on **HTTP-Only Cookies** for the actual session transport. This prevents XSS attacks from stealing tokens.
2.  **Optimistic UI**: A client-side "convenience cookie" is used to allow the UI to instantly render the authenticated state while the background validation occurs.
3.  **Passwordless First**: The primary login flows (Magic Link & GitHub OAuth) eliminate the need for users to remember passwords, reducing support friction and increasing security.

## Architectural Patterns

### 1. Context-Injected Routing
To handle the "chicken-and-egg" problem of initializing dependencies (like the API client) before the application renders, we use **Context Injection**. The Router is aware of the Dependency Injection container (Query Client) at the type level. This ensures that every route loader has guaranteed access to data fetching tools without runtime checks.

### 2. Server-State Management
Instead of a monolithic Redux or Zustand store, we treat the backend as the single source of truth.
- **Queries**: Auto-cached, deduped, and revalidated on window focus.
- **Mutations**: triggers for "Invalidation", causing the UI to automatically refetch fresh data after an update (e.g., creating a project automatically updates the list).

### 3. Visual Design System
We strictly separate **Layout** (Tailwind) from **Logic** (Headless UI). We use unstyled primitives (Radix UI) for accessibility (keyboard nav, screen readers) and apply our custom Tailwind v4 theme on top. This ensures the app is accessible by default while looking distinctively "Base0".
