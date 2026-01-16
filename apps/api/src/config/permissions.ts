export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export type Permission =
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'member:manage'
  | 'collection:create'
  | 'collection:update'
  | 'collection:delete'
  | 'document:read'
  | 'document:create'
  | 'document:update'
  | 'document:delete'
  | 'storage:manage';

export type Scope = 'read' | 'write' | 'admin';

export const RolePermissions: Record<Role, Permission[]> = {
  owner: [
    'project:read',
    'project:update',
    'project:delete',
    'member:manage',
    'collection:create',
    'collection:update',
    'collection:delete',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'storage:manage',
  ],
  admin: [
    'project:read',
    'project:update',
    'member:manage',
    'collection:create',
    'collection:update',
    'collection:delete',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'storage:manage',
  ],
  member: [
    'project:read',
    'collection:create',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
  ],
  viewer: ['project:read', 'document:read'],
};

export const ScopePermissions: Record<Scope, Permission[]> = {
  read: ['project:read', 'document:read'],
  write: [
    'project:read',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'collection:create',
  ],
  admin: [
    'project:read',
    'project:update',
    'collection:create',
    'collection:update',
    'collection:delete',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'storage:manage',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return RolePermissions[role].includes(permission);
}

export function hasScopePermission(scopes: string[], permission: Permission): boolean {
  return scopes.some((s) => {
    const scope = s as Scope;
    return ScopePermissions[scope]?.includes(permission);
  });
}
