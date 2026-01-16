import { db } from '@base0/db';
import { projectMembers, projects } from '@base0/db/schema';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { authMiddleware, getAuthContext, getAuthUser } from '../middleware/auth';
import type { AuthVariables } from '../types';

const projectsRoute = new Hono<{ Variables: AuthVariables }>();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  config: z.record(z.unknown()).optional().default({}),
});

/**
 * GET /v1/projects
 * List projects owned by the authenticated user
 */
projectsRoute.get('/', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c);

  try {
    const userProjects = await db.select().from(projects).where(eq(projects.ownerId, userId));

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
projectsRoute.get('/:id', authMiddleware, async (c) => {
  const auth = getAuthContext(c);
  const projectId = c.req.param('id');

  try {
    // If API Key, check if it matches the requested project
    if (auth.authType === 'apiKey') {
      if (auth.projectId !== projectId) {
        return c.json({ error: 'Unauthorized: API Key is not valid for this project' }, 403);
      }
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(
        auth.authType === 'apiKey'
          ? eq(projects.id, projectId)
          : and(eq(projects.id, projectId), eq(projects.ownerId, auth.userId ?? '')),
      )
      .limit(1);

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
 * Delete a project
 */
projectsRoute.delete('/:id', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c);
  const projectId = c.req.param('id');

  try {
    const deleted = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
      .returning();

    if (deleted.length === 0) {
      return c.json({ error: 'Project not found or unauthorized' }, 404);
    }

    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

export default projectsRoute;
