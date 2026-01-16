import { db } from '@base0/db';
import { collections, projectMembers, projects } from '@base0/db/schema';
import { and, eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import {
  hasPermission,
  hasScopePermission,
  type Permission,
  type Role,
} from '../config/permissions';
import type { AuthVariables } from '../types';
import { getAuthContext } from './auth';

/**
 * Middleware to check for a specific permission in a project context
 * Requires projectId to be present in params or query
 */
export const requirePermission = (permission: Permission) => {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const auth = getAuthContext(c);

    // 1. If API Key, check against scopes
    if (auth.authType === 'apiKey') {
      if (hasScopePermission(auth.scopes || [], permission)) {
        return await next();
      }
      return c.json(
        {
          error: `Forbidden: API Key missing required scope for: ${permission}`,
          scopes: auth.scopes,
        },
        403,
      );
    }

    // 2. Resolve Project ID (Check param, query, then try body)
    let projectId = c.req.param('projectId') || c.req.param('id') || c.req.query('projectId');

    if (
      !projectId &&
      (c.req.method === 'POST' || c.req.method === 'PATCH' || c.req.method === 'PUT')
    ) {
      // Note: Reading body multiple times might require c.req.json() / c.req.parseBody() careful handling
      // For now we assume typical JSON or Form data
      try {
        const bodyObj = (await c.req.parseBody().catch(() => ({}))) as Record<string, unknown>;
        projectId = bodyObj.projectId as string | undefined;
        if (!projectId) {
          const jsonObj = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
          projectId = jsonObj.projectId as string | undefined;
        }
      } catch (_e) {
        // Body already read or failed to parse
      }
    }

    if (!projectId) {
      return c.json({ error: 'Project ID context required' }, 400);
    }

    // 3. Check membership and role
    const [member] = await db
      .select()
      .from(projectMembers)
      .where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, auth.userId ?? '')),
      )
      .limit(1);

    if (!member) {
      // Check if project exists to provide a better error (404 instead of 403)
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        return c.json({ error: 'Project not found' }, 404);
      }
      return c.json({ error: 'Forbidden: You are not a member of this project' }, 403);
    }

    if (!hasPermission(member.role as Role, permission)) {
      return c.json(
        {
          error: `Forbidden: Missing required permission: ${permission}`,
          role: member.role,
        },
        403,
      );
    }

    // Update context with the resolved role
    c.set('auth', {
      ...auth,
      role: member.role as Role,
    });

    return await next();
  };
};
/**
 * Middleware to check for permission on a specific resource (e.g. collection)
 * It will resolve the projectId from the resource first.
 */
export const requireResourcePermission = (resourceType: 'collection', permission: Permission) => {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const auth = getAuthContext(c);
    const resourceId = c.req.param('collectionId') || c.req.param('id');

    if (!resourceId) {
      return c.json({ error: 'Resource ID required' }, 400);
    }

    let projectId: string | null = null;

    if (resourceType === 'collection') {
      const [col] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, resourceId))
        .limit(1);

      if (!col) return c.json({ error: 'Collection not found' }, 404);
      projectId = col.projectId;
      c.set('collection', col); // Attach for downstream use
    }

    if (!projectId) return c.json({ error: 'Could not resolve project' }, 400);

    // API Key Bypass (if it belongs to the same project)
    if (auth.authType === 'apiKey') {
      if (auth.projectId !== projectId) {
        return c.json({ error: 'Unauthorized: API Key invalid for this resource' }, 403);
      }
      if (hasScopePermission(auth.scopes || [], permission)) {
        return await next();
      }
      return c.json({ error: 'Forbidden: API Key missing required scope' }, 403);
    }

    // Check user membership
    const [member] = await db
      .select()
      .from(projectMembers)
      .where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, auth.userId ?? '')),
      )
      .limit(1);

    if (!member) {
      return c.json({ error: 'Forbidden: You are not a member of this project' }, 403);
    }

    if (!hasPermission(member.role as Role, permission)) {
      return c.json({ error: `Forbidden: Missing permission ${permission}` }, 403);
    }

    c.set('auth', { ...auth, role: member.role as Role });
    return await next();
  };
};
