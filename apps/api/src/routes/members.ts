import { db } from '@base0/db';
import { projectMembers, users } from '@base0/db/schema';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import type { AuthVariables } from '../types';

const membersRoute = new Hono<{ Variables: AuthVariables }>();

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});

/**
 * GET /v1/projects/:projectId/members
 * List all members of a project
 */
membersRoute.get('/', authMiddleware, requirePermission('project:read'), async (c) => {
  const projectId = c.req.param('projectId');

  const members = await db
    .select({
      id: projectMembers.id,
      userId: projectMembers.userId,
      role: projectMembers.role,
      createdAt: projectMembers.createdAt,
      user: {
        email: users.email,
      },
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId ?? ''));

  return c.json({ members });
});

/**
 * POST /v1/projects/:projectId/members
 * Add/Invite a member to a project
 */
membersRoute.post(
  '/',
  authMiddleware,
  zValidator('json', inviteMemberSchema),
  requirePermission('member:manage'),
  async (c) => {
    const projectId = c.req.param('projectId');
    const { email, role } = c.req.valid('json');

    // 1. Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return c.json({ error: 'User with this email not found. They must sign up first.' }, 404);
    }

    // 2. Check if already a member
    const [existing] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId ?? ''), eq(projectMembers.userId, user.id)))
      .limit(1);

    if (existing) {
      return c.json({ error: 'User is already a member of this project' }, 400);
    }

    // 3. Add member
    const [newMember] = await db
      .insert(projectMembers)
      .values({
        projectId,
        userId: user.id,
        role,
      })
      .returning();

    return c.json({ message: 'Member added successfully', member: newMember }, 201);
  },
);

/**
 * PATCH /v1/projects/:projectId/members/:userId
 * Update member role
 */
membersRoute.patch(
  '/:userId',
  authMiddleware,
  zValidator('json', updateMemberSchema),
  requirePermission('member:manage'),
  async (c) => {
    const projectId = c.req.param('projectId');
    const userId = c.req.param('userId');
    const { role } = c.req.valid('json');

    const updated = await db
      .update(projectMembers)
      .set({ role })
      .where(
        and(eq(projectMembers.projectId, projectId ?? ''), eq(projectMembers.userId, userId ?? '')),
      )
      .returning();

    if (updated.length === 0) {
      return c.json({ error: 'Member not found' }, 404);
    }

    return c.json({ message: 'Member updated successfully', member: updated[0] });
  },
);

/**
 * DELETE /v1/projects/:projectId/members/:userId
 * Remove a member from the project
 */
membersRoute.delete('/:userId', authMiddleware, requirePermission('member:manage'), async (c) => {
  const projectId = c.req.param('projectId');
  const userId = c.req.param('userId');

  const deleted = await db
    .delete(projectMembers)
    .where(
      and(eq(projectMembers.projectId, projectId ?? ''), eq(projectMembers.userId, userId ?? '')),
    )
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: 'Member not found' }, 404);
  }

  return c.json({ message: 'Member removed successfully' });
});

export default membersRoute;
