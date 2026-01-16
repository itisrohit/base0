import { db } from '@base0/db';
import {
  apiKeys,
  buckets,
  collections,
  documents,
  files,
  projectMembers,
  projects,
} from '@base0/db/schema';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { authMiddleware, getAuthUser } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import type { AuthVariables } from '../types';

const projectsRoute = new Hono<{ Variables: AuthVariables }>();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  config: z.record(z.unknown()).optional().default({}),
});

/**
 * GET /v1/projects
 * List projects where the authenticated user is a member
 */
projectsRoute.get('/', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c);

  try {
    // Select projects via project_members to include those where user is not the owner
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        ownerId: projects.ownerId,
        config: projects.config,
        createdAt: projects.createdAt,
        role: projectMembers.role,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, userId));

    return c.json({ projects: userProjects });
  } catch (error) {
    console.error('List projects error:', error);
    return c.json({ error: 'Failed to list projects' }, 500);
  }
});

/**
 * POST /v1/projects
 * Create a new project
 */
projectsRoute.post('/', authMiddleware, zValidator('json', createProjectSchema), async (c) => {
  const { userId } = getAuthUser(c);
  const { name, config } = c.req.valid('json');

  try {
    const [project] = await db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(projects)
        .values({
          id: `proj_${nanoid(12)}`,
          name,
          ownerId: userId,
          config,
        })
        .returning();

      await tx.insert(projectMembers).values({
        projectId: newProject.id,
        userId: userId,
        role: 'owner',
      });

      return [newProject];
    });

    return c.json(
      {
        message: 'Project created successfully',
        project,
      },
      201,
    );
  } catch (error) {
    console.error('Create project error:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

/**
 * GET /v1/projects/:id
 * Get details of a specific project
 */
projectsRoute.get('/:id', authMiddleware, requirePermission('project:read'), async (c) => {
  const projectId = c.req.param('id');

  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    return c.json({ error: 'Failed to get project' }, 500);
  }
});

/**
 * DELETE /v1/projects/:id
 * Delete a project (Only owners can do this)
 */
projectsRoute.delete('/:id', authMiddleware, requirePermission('project:delete'), async (c) => {
  const projectId = c.req.param('id');

  try {
    await db.transaction(async (tx) => {
      // 1. Delete Documents first (children of Collections)
      const projectCollections = await tx
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.projectId, projectId));

      for (const col of projectCollections) {
        await tx.delete(documents).where(eq(documents.collectionId, col.id));
      }

      // 2. Delete Files first (children of Buckets)
      const projectBuckets = await tx
        .select({ id: buckets.id })
        .from(buckets)
        .where(eq(buckets.projectId, projectId));

      for (const bucket of projectBuckets) {
        await tx.delete(files).where(eq(files.bucketId, bucket.id));
      }

      // 3. Delete direct children
      await tx.delete(collections).where(eq(collections.projectId, projectId));
      await tx.delete(buckets).where(eq(buckets.projectId, projectId));
      await tx.delete(apiKeys).where(eq(apiKeys.projectId, projectId));
      await tx.delete(projectMembers).where(eq(projectMembers.projectId, projectId));

      // 4. Delete the project itself
      const deleted = await tx.delete(projects).where(eq(projects.id, projectId)).returning();

      if (deleted.length === 0) {
        throw new Error('Project not found');
      }
    });

    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error details:', error);
    return c.json(
      {
        error: 'Failed to delete project',
        message: (error as Error).message,
      },
      500,
    );
  }
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.record(z.unknown()).optional(),
});

/**
 * PATCH /v1/projects/:id
 * Update project settings
 */
projectsRoute.patch(
  '/:id',
  authMiddleware,
  requirePermission('project:update'),
  zValidator('json', updateProjectSchema),
  async (c) => {
    const projectId = c.req.param('id');
    const data = c.req.valid('json');

    try {
      const [updated] = await db
        .update(projects)
        .set(data)
        .where(eq(projects.id, projectId))
        .returning();

      if (!updated) {
        return c.json({ error: 'Project not found' }, 404);
      }

      return c.json({ message: 'Project updated successfully', project: updated });
    } catch (error) {
      console.error('Update project error:', error);
      return c.json({ error: 'Failed to update project' }, 500);
    }
  },
);

export default projectsRoute;
