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

export function hasPermission(role: Role, permission: Permission): boolean {
  return RolePermissions[role].includes(permission);
}
