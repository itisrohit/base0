import type { collections } from '@base0/db/schema';

export type Collection = typeof collections.$inferSelect;

export interface AuthVariables {
  auth: {
    userId?: string; // Present for JWT (User sessions)
    email?: string; // Present for JWT
    projectId: string; // Always present (Key-based or inferred from user)
    keyId?: string; // Present for API Key auth
    authType: 'jwt' | 'apiKey';
    scopes?: string[]; // For API Keys
  };
  collection?: Collection;
}
