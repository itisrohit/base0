# Base0 Roadmap (2026+)

This document outlines the future development phases for the Base0 platform, building upon the core v1 foundation.

## Core v1 (Completed) ✅
*   **Authentication**: Email/Password, Magic Links, GitHub OAuth.
*   **Database**: Dynamic JSONB schema, CRUD, Filtering, Multi-tenancy.
*   **Storage**: S3/MinIO compatible object storage.
*   **Access Control**: RBAC, API Keys, Permissions.
*   **Dashboard**: Full management UI.

---

## Phase 2: Advanced Data & AI (Planned)
*Focus: Leveraging modern AI capabilities and advanced data structures.*

### 2.1 Vector Database Integration
*   **Goal**: Native support for vector embeddings to enable semantic search and AI RAG (Retrieval-Augmented Generation) workflows.
*   **Implementation Strategy**:
    *   Integrate `pgvector` extension for PostgreSQL 18.
    *   Add `vector` type to the JSONB schema definition.
    *   Expose similarity search operators (cosine distance, euclidean, etc.) via the filtering engine.
    *   Auto-generate embeddings using an optional OpenAI/Cloudflare AI Worker integration.

### 2.2 Full-Text Search
*   **Goal**: High-performance, typo-tolerant search across millions of records.
*   **Implementation Strategy**:
    *   **Option A**: Native Postgres Full Text Search (tsvector/tsquery). Good for medium scale.
    *   **Option B**: Integration with **Meilisearch** or **Typesense** (as a sidecar container) for dedicated search workloads.
    *   Sync engine to replicate collection writes to the search index.

### 2.3 Graph Relationships
*   **Goal**: Modeling complex, deep relationships without complex joins.
*   **Implementation**:
    *   Enhanced foreign key referencing in JSONB schemas.
    *   Recursive query support for tree structures (e.g., nested comments, organization hierarchies).

---

## Phase 3: Realtime & Event Systems (Planned)
*Focus: Enabling collaborative and reactive application experiences.*

### 3.1 Realtime Engine
*   **Goal**: Push updates to clients instantly when data changes.
*   **Implementation Strategy**:
    *   **Architecture**: WebSocket server powered by Bun's native `Bun.serve({ websocket })`.
    *   **Mechanism**: PostgreSQL `NOTIFY/LISTEN` channels to detect database changes (Change Data Capture).
    *   **Client SDK**: Subscription API (e.g., `client.collection('posts').subscribe(...)`).
    *   **Protocol**: Lightweight JSON-based protocol with automatic reconnection and state reconciliation.

### 3.2 Server-Side Functions (Edge Functions)
*   **Goal**: Allow users to run custom logic triggered by events or webhooks.
*   **Implementation**:
    *   V8 Isolate sandboxing (via Deno or simple JS eval contexts) to execute user code safely.
    *   Triggers: `onBeforeCreate`, `onAfterUpdate`, `onSchedule` (Cron).

### 3.3 Event Bus & Webhooks
*   **Goal**: External integrations.
*   **Implementation**:
    *   Reliable webhook delivery system with retries (using a Redis/Postgres backed queue).
    *   Admin UI to view payload logs and redelivery status.

---

## Phase 4: Enterprise Identity & Security (Planned)
*Focus: Hardening security and standardizing the authentication experience.*

### 4.1 Authentication Experience (DevEx)
*   **Goal**: Provide a "drop-in" authentication solution that rivals commercial providers in ease of use.
*   **Implementation Strategy**:
    *   **Unified Auth SDK (Client-side)**:
        *   Single import library: `import { auth } from '@base0/client'`.
        *   Methods: `auth.signUp()`, `auth.signInWithPassword()`, `auth.signInWithOAuth()`, `auth.signOut()`.
    *   **Automated Session Management**:
        *   SDK automatically handles `access_token` storage (in-memory) and `refresh_token` rotation (httpOnly cookie).
        *   Silent refresh mechanism to keep users logged in across page reloads without exposing tokens.
    *   **Reactive State Hooks**:
        *   Real-time listeners: `auth.onAuthStateChange((event, session) => { ... })`.
        *   Events: `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`.
    *   **Security Standards**:
        *   PKCE (Proof Key for Code Exchange) flow for all OAuth operations.
        *   CSRF protection built-in to all mutation endpoints.
        *   Auto-redirect handling for OAuth callbacks (e.g., successful GitHub login -> redirect to configured app URL).

### 4.2 Advanced Authentication Flows
*   **MFA / 2FA**: TOTP (Authenticator App) integration.
*   **Passkeys (WebAuthn)**: Biometric passwordless login (FaceID/TouchID).
*   **SAML / SSO**: Enterprise login for Okta, Auth0, and Active Directory integration.
*   **Anonymous Login**: Temporary guest sessions that can be "upgraded" to full accounts.

### 4.3 Security Hardening
*   **Audit Logs**: Immutable logs of all admin actions (who changed what schema, who deleted what key).
*   **IP Whitelisting**: Restrict API key usage to specific CIDR blocks.
*   **Advanced Rate Limiting**: Redis-backed sliding window limiters per IP/User/Tenant.

---

## Phase 5: Infrastructure & Scaling (Planned)
*Focus: Horizontal scalability and observability.*

### 5.1 Observability Stack
*   **Metrics**: Native Prometheus endpoint exporting generic runtime metrics (memory, CPU, DB pool).
*   **Tracing**: OpenTelemetry integration for distributed tracing across services.

### 5.2 Horizontal Scaling
*   **Read Replicas**: Support for separating Read/Write DB connections.
*   **Stateless API**: Ensure API nodes can scale infinitely behind a load balancer (Redis for shared session state).

### 5.3 Multi-Region Replication
*   **Goal**: Bring data closer to global users.
*   **Strategy**: Leveraging distributed SQLite (e.g., Turso/LibSQL) or Postgres logical replication.
