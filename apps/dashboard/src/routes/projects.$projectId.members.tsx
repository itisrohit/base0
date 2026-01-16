import { createRoute, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProjectNav } from '@/components/layout/project-nav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useInviteMember, useMembers, useRemoveMember, useUpdateMember } from '@/hooks/use-members';
import { authenticatedLayout } from './_authenticated';

export const projectMembersRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: '/projects/$projectId/members',
  component: () => (
    <DashboardLayout>
      <ProjectMembersPage />
    </DashboardLayout>
  ),
});

function ProjectMembersPage() {
  const { projectId } = useParams({ from: '/authenticated/projects/$projectId/members' });
  const { user: currentUser } = useAuth();
  const { data: members, isLoading } = useMembers(projectId);
  const inviteMember = useInviteMember(projectId);
  const updateMember = useUpdateMember(projectId);
  const removeMember = useRemoveMember(projectId);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      setInviteRole('member');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Failed to invite member');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    await updateMember.mutateAsync({ userId, role });
  };

  const handleRemove = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember.mutateAsync(userId);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading members...</div>;

  return (
    <div className="space-y-6">
      <ProjectNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Members</h1>
          <p className="text-muted-foreground mt-1">Manage who can access and edit this project</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invite Form */}
        <div className="lg:col-span-1 border border-border rounded-lg p-6 bg-card h-fit">
          <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm outline-none"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? 'Inviting...' : 'Invite Member'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              New members must already have a Base0 account to be added.
            </p>
          </form>
        </div>

        {/* Member List */}
        <div className="lg:col-span-2 border border-border rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members?.map((member) => (
                <tr key={member.id} className="hover:bg-muted/20 transition-colors text-sm">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{member.user.email}</div>
                    {member.userId === currentUser?.id && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {member.role === 'owner' ? (
                      <span className="capitalize">{member.role}</span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                        className="bg-transparent text-sm outline-none border-b border-transparent hover:border-border cursor-pointer"
                        disabled={member.userId === currentUser?.id}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {member.role !== 'owner' && member.userId !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(member.userId)}
                        disabled={removeMember.isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
