# Authentication Strategy 2026: Magic Links & OIDC

## Overview
To fulfill the "Advanced Authentication" requirements (Magic Links & OAuth2) while adhering to Base0's philosophy of **"Minimalist System Design"** and **"Type-Safe or Bust"**, we evaluated modern solutions in the Hono/Bun ecosystem.

## Evaluation Results

### Options Considered
1.  **Better Auth**: A comprehensive, pluggable auth framework.
    *   *Pros*: Handles everything (Sessions, OAuth, 2FA, Magic Links).
    *   *Cons*: Introduces significant "magic" and abstraction layers. Might conflict with our existing custom JWT/Argon2 implementation.
2.  **Arctic** (by creators of Lucia): A low-level OAuth 2.0 / OpenID Connect client.
    *   *Pros*: Zero magic. Just handles the handshake (URL generation, code exchange). Fully type-safe.
    *   *Cons*: We must write the route handlers and database logic ourselves.
3.  **Custom Implementation**:
    *   *Pros*: Perfect integration with our existing schema. 100% control.
    *   *Cons*: High security burden for OIDC flows (requires careful state/PKCE handling).

## Recommended Strategy: "Arctic + Custom"

We choose **Arctic** for OAuth and a **Custom Implementation** for Magic Links. This fits the "Base0" vision: providing robust *primitives* without the bloat of a "meta-framework".

### 1. Magic Links / Passwordless
**Architecture:**
*   **Database**: Add `magic_links` table.
    *   `token_hash` (Primary lookup, secure hash of the token sent to user)
    *   `user_email` (To link/create user)
    *   `expires_at` (Short TTL: 5-15 mins)
    *   `used` (Boolean, prevent replay)
*   **Flow**:
    1.  `POST /auth/magic-link`: User submits email.
    2.  Server generates secure random token + hash.
    3.  Server sends email (mocked for local, pluggable adapter for prod).
    4.  User clicks link -> `GET /auth/verify-magic-link?token=xyz`.
    5.  Server validates hash, checks expiration, exchanges for standard **JWT Access/Refresh Tokens**.

### 2. OIDC / OAuth2 Pluggable Interface
**Architecture:**
*   **Library**: Use `arctic` for generating authorization URLs and validating callback codes.
*   **Database**: Add `oauth_accounts` table.
    *   `provider` (enum: 'google', 'github', etc.)
    *   `provider_user_id` (The ID from the provider)
    *   `user_id` (FK to our `users` table)
*   **Flow**:
    1.  `GET /auth/login/:provider`: Redirects to Google/GitHub (using Arctic).
    2.  `GET /auth/callback/:provider`:
        *   Arctic validates `code` + `state`.
        *   Fetch user profile from provider.
        *   Find or Create user in `users`.
        *   Link identity in `oauth_accounts`.
        *   Issue **JWT Access/Refresh Tokens**.

## Implementation Plan
This approach requires no rewrite of our existing Auth, only *extension*.

1.  **Schema Updates**: Add `magic_links` and `oauth_accounts`.
2.  **Dependency**: Install `arctic` (and `oslo` for crypto utils).
3.  **API Routes**: Add `magic-link` and `oauth` endpoints to `src/routes/auth.ts`.
