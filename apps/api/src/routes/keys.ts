import { db } from '@base0/db';
import { apiKeys, projects } from '@base0/db/schema';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { authMiddleware, getAuthUser } from '../middleware/auth';
import type { AuthVariables } from '../types';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 21);

const keysRoute = new Hono<{ Variables: AuthVariables }>();

// Validation schema for creating an API key
const createKeySchema = z.object({
  projectId: z.string(),
  scopes: z.array(z.string()).optional().default(['read']),
});

/**
 * GET /v1/projects/:projectId/keys
 * List all API keys for a project
 */
keysRoute.get('/:projectId/keys', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c);
  const projectId = c.req.param('projectId');

  try {
    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found or unauthorized' }, 404);
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        projectId: apiKeys.projectId,
        scopes: apiKeys.scopes,
      })
      .from(apiKeys)
      .where(eq(apiKeys.projectId, projectId));

    return c.json({ keys });
  } catch (error) {
    console.error('List keys error:', error);
    return c.json({ error: 'Failed to list API keys' }, 500);
  }
});

/**
 * POST /v1/keys
 * Generate a new API key for a project
 */
keysRoute.post('/', authMiddleware, zValidator('json', createKeySchema), async (c) => {
  const { userId } = getAuthUser(c);
  const { projectId, scopes } = c.req.valid('json');

  try {
    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found or unauthorized' }, 404);
    }

    // Generate a new API key pair
    const keyId = nanoid(12); // Public ID for lookup
    const secret = nanoid(32); // Secret part
    const rawKey = `b0_${keyId}_${secret}`;

    // Hash the secret part for storage
    const keyHash = await Bun.password.hash(secret);

    const [newKey] = await db
      .insert(apiKeys)
      .values({
        keyId,
        projectId,
        keyHash,
        scopes,
      })
      .returning();

    return c.json(
      {
        message: 'API key created successfully. Store this safely, it will not be shown again.',
        apiKey: rawKey, // Show the raw key once
        id: newKey.id,
        keyId: newKey.keyId,
        projectId: newKey.projectId,
        scopes: newKey.scopes,
      },
      201,
    );
  } catch (error) {
    console.error('Create key error:', error);
    return c.json({ error: 'Failed to create API key' }, 500);
  }
});

/**
 * DELETE /v1/keys/:id
 * Revoke an API key
 */
keysRoute.delete('/:id', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c);
  const keyId = c.req.param('id');

  try {
    // Find the key and verify project ownership in one query
    const [key] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .innerJoin(projects, eq(apiKeys.projectId, projects.id))
      .where(and(eq(apiKeys.id, keyId), eq(projects.ownerId, userId)))
      .limit(1);

    if (!key) {
      return c.json({ error: 'API key not found or unauthorized' }, 404);
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

    return c.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Delete key error:', error);
    return c.json({ error: 'Failed to revoke API key' }, 500);
  }
});

export default keysRoute;
