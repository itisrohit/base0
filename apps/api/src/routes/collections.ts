import { db } from '@base0/db';
import { collections } from '@base0/db/schema';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import type { AuthVariables } from '../types';

const collectionsRoute = new Hono<{ Variables: AuthVariables }>();

// Validation schema for creating a collection
const createCollectionSchema = z.object({
  schemaDef: z.object({
    fields: z.array(
      z.object({
        name: z
          .string()
          .min(1)
          .max(50)
          .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscores allowed'),
        type: z.enum(['string', 'number', 'boolean', 'date', 'email', 'url', 'json']),
        required: z.boolean().optional().default(false),
      }),
    ),
  }),
  permissions: z.record(z.unknown()).optional().default({}),
});

/**
 * GET /
 * List all collections in the current project context
 */
collectionsRoute.get('/', authMiddleware, requirePermission('project:read'), async (c) => {
  const projectId = c.req.param('projectId');

  try {
    const projectCollections = await db
      .select()
      .from(collections)
      .where(eq(collections.projectId, projectId));

    return c.json({ collections: projectCollections });
  } catch (error) {
    console.error('List collections error:', error);
    return c.json({ error: 'Failed to list collections' }, 500);
  }
});

/**
 * POST /
 * Create a new collection in the current project context
 */
collectionsRoute.post(
  '/',
  authMiddleware,
  zValidator('json', createCollectionSchema),
  requirePermission('collection:create'),
  async (c) => {
    const projectId = c.req.param('projectId');
    const { schemaDef, permissions } = c.req.valid('json');

    try {
      const [newCollection] = await db
        .insert(collections)
        .values({
          projectId,
          schemaDef,
          permissions,
        })
        .returning();

      return c.json(
        {
          message: 'Collection created successfully',
          collection: newCollection,
        },
        201,
      );
    } catch (error) {
      console.error('Create collection error:', error);
      return c.json({ error: 'Failed to create collection' }, 500);
    }
  },
);

/**
 * DELETE /:id
 * Delete a collection by ID (Note: This is usually called on /v1/collections/:id)
 * If mounted under project, we use :id as collectionId
 */
collectionsRoute.delete(
  '/:id',
  authMiddleware,
  requirePermission('collection:delete'),
  async (c) => {
    const collectionId = c.req.param('id');

    try {
      const deleted = await db
        .delete(collections)
        .where(eq(collections.id, collectionId))
        .returning();

      if (deleted.length === 0) {
        return c.json({ error: 'Collection not found' }, 404);
      }

      return c.json({ message: 'Collection deleted successfully' });
    } catch (error) {
      console.error('Delete collection error:', error);
      return c.json({ error: 'Failed to delete collection' }, 500);
    }
  },
);

export default collectionsRoute;
