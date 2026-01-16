import { db } from '@base0/db';
import { collections, projects } from '@base0/db/schema';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, getAuthUser } from '../middleware/auth';
import type { AuthVariables } from '../types';

const collectionsRoute = new Hono<{ Variables: AuthVariables }>();

// Validation schema for creating a collection
const createCollectionSchema = z.object({
  projectId: z.string(),
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
 * Middleware to check project ownership
 */
const checkProjectOwnership = async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
  const { userId } = getAuthUser(c);
  // Support both body and param for projectId
  const body = (await c.req.parseBody().catch(() => ({}))) as Record<string, unknown>;
  const json = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

  const projectId =
    c.req.param('projectId') ||
    (json.projectId as string | undefined) ||
    (body.projectId as string | undefined);

  if (!projectId) {
    return c.json({ error: 'Project ID is required' }, 400);
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1);

  if (!project) {
    return c.json({ error: 'Project not found or unauthorized' }, 404);
  }

  return next();
};

/**
 * GET /v1/projects/:projectId/collections
 * List all collections in a project
 */
collectionsRoute.get(
  '/:projectId/collections',
  authMiddleware,
  checkProjectOwnership,
  async (c) => {
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
  },
);

/**
 * POST /v1/collections
 * Create a new collection (can be called with projectId in body)
 */
collectionsRoute.post(
  '/',
  authMiddleware,
  zValidator('json', createCollectionSchema),
  checkProjectOwnership,
  async (c) => {
    const { projectId, schemaDef, permissions } = c.req.valid('json');

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
 * DELETE /v1/collections/:id
 * Delete a collection
 */
collectionsRoute.delete('/:id', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c);
  const collectionId = c.req.param('id');

  try {
    // We need to check ownership via the project
    const [collection] = await db
      .select({
        id: collections.id,
        projectId: collections.projectId,
        ownerId: projects.ownerId,
      })
      .from(collections)
      .innerJoin(projects, eq(collections.projectId, projects.id))
      .where(and(eq(collections.id, collectionId), eq(projects.ownerId, userId)))
      .limit(1);

    if (!collection) {
      return c.json({ error: 'Collection not found or unauthorized' }, 404);
    }

    await db.delete(collections).where(eq(collections.id, collectionId));

    return c.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Delete collection error:', error);
    return c.json({ error: 'Failed to delete collection' }, 500);
  }
});

export default collectionsRoute;
