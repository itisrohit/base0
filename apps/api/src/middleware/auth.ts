import { db } from '@base0/db';
import { apiKeys } from '@base0/db/schema';
import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { verifyToken } from '../lib/jwt';
import type { AuthVariables } from '../types';

/**
 * Authentication middleware
 * Verifies either JWT token or API Key
 */
export async function authMiddleware(c: Context<{ Variables: AuthVariables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const apiKeyHeader = c.req.header('X-API-Key');
  const projectHeader = c.req.header('X-Base0-Project');

  // 1. Try API Key Auth First (Header X-API-Key or Bearer b0_...)
  let rawApiKey = apiKeyHeader;
  if (!rawApiKey && authHeader?.startsWith('Bearer b0_')) {
    rawApiKey = authHeader.substring(7);
  }

  if (rawApiKey?.startsWith('b0_')) {
    const parts = rawApiKey.split('_');
    if (parts.length === 3) {
      const keyId = parts[1];
      const secret = parts[2];

      try {
        const [keyDoc] = await db.select().from(apiKeys).where(eq(apiKeys.keyId, keyId)).limit(1);

        if (keyDoc) {
          const isValid = await Bun.password.verify(secret, keyDoc.keyHash);
          if (isValid) {
            c.set('auth', {
              projectId: keyDoc.projectId ?? '',
              keyId: keyDoc.keyId,
              authType: 'apiKey',
              scopes: keyDoc.scopes || [],
            });
            return await next();
          }
        }
      } catch (error) {
        console.error('API Key verification error:', error);
      }
    }
  }

  // 2. Try JWT Auth (Authorization: Bearer <jwt>)
  if (authHeader?.startsWith('Bearer ') && !authHeader.startsWith('Bearer b0_')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyToken(token);
      if (payload.type === 'access') {
        // For JWT, we might need a project context for resource routes
        const projectId = projectHeader || ''; // Simplified for now

        c.set('auth', {
          userId: payload.userId,
          email: payload.email,
          projectId, // May be empty for auth-only routes
          authType: 'jwt',
        });
        return await next();
      }
    } catch (_error) {
      // Token invalid, fall through
    }
  }

  return c.json({ error: 'Unauthorized: Missing or invalid authentication' }, 401);
}

/**
 * Helper to get strict JWT auth context (User only)
 */
export function getAuthUser(c: Context<{ Variables: AuthVariables }>) {
  const auth = c.get('auth');
  if (!auth || auth.authType !== 'jwt' || !auth.userId) {
    throw new Error('User session required');
  }
  return {
    userId: auth.userId,
    email: auth.email ?? '',
    projectId: auth.projectId,
  };
}

/**
 * Helper to get strict API Key auth context
 */
export function getAuthKey(c: Context<{ Variables: AuthVariables }>) {
  const auth = c.get('auth');
  if (!auth || auth.authType !== 'apiKey') {
    throw new Error('API Key required');
  }
  return {
    keyId: auth.keyId ?? '',
    projectId: auth.projectId,
    scopes: auth.scopes || [],
  };
}

/**
 * Helper to get any authenticated context
 */
export function getAuthContext(c: Context<{ Variables: AuthVariables }>) {
  const auth = c.get('auth');
  if (!auth) {
    throw new Error('Authentication required');
  }
  return auth;
}
