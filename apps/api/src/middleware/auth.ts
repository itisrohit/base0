import type { Context, Next } from 'hono';
import { verifyToken } from '../lib/jwt';

export interface AuthContext {
  userId: string;
  email: string;
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      return c.json({ error: 'Unauthorized: Invalid token type' }, 401);
    }

    // Attach user info to context
    c.set('auth', {
      userId: payload.userId,
      email: payload.email,
    } as AuthContext);

    await next();
  } catch (error) {
    return c.json(
      {
        error: 'Unauthorized: Invalid or expired token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      401,
    );
  }
}

/**
 * Helper to get authenticated user from context
 */
export function getAuthUser(c: Context): AuthContext {
  const auth = c.get('auth') as AuthContext | undefined;
  if (!auth) {
    throw new Error('User not authenticated');
  }
  return auth;
}
