import type { collections } from '@base0/db/schema';

export type Collection = typeof collections.$inferSelect;

export interface AuthVariables {
  auth: {
    userId: string;
    email: string;
  };
  collection?: Collection;
}
