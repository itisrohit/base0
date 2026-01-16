import { createRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProjectNav } from '@/components/layout/project-nav';
import { Button } from '@/components/ui/button';
import { useDeleteProject, useProject, useUpdateProject } from '@/hooks/use-projects';
import { rootRoute } from './__root';

export const projectSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/settings',
  component: () => (
    <DashboardLayout>
      <ProjectSettingsPage />
    </DashboardLayout>
  ),
});

function ProjectSettingsPage() {
  const { projectId } = useParams({ from: '/projects/$projectId/settings' });
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject(projectId);
  const deleteProject = useDeleteProject();

  const [name, setName] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
    }
  }, [project]);

  const handleSave = async () => {
    if (!name) return;
    try {
      await updateProject.mutateAsync({ name });
      alert('Project updated successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Failed to update project');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject.mutateAsync(projectId);
        navigate({ to: '/' });
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        alert(error.response?.data?.error || 'Failed to delete project');
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <ProjectNav />

      <div>
        <h1 className="text-3xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground mt-1">General configuration for your project</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="border border-border rounded-lg p-6 bg-card space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">General</h2>
          <div className="space-y-2">
            <label htmlFor="projectId" className="text-sm font-medium">
              Project ID
            </label>
            <input
              id="projectId"
              type="text"
              value={projectId}
              readOnly
              className="w-full px-3 py-2 bg-muted border border-input rounded-md text-sm outline-none font-mono text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="projectName" className="text-sm font-medium">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm outline-none"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={updateProject.isPending || name === project?.name}
            >
              {updateProject.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="border border-destructive/20 rounded-lg p-6 bg-destructive/5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground">
            Once you delete a project, there is no going back. Please be certain.
          </p>
          <div className="flex justify-start">
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
