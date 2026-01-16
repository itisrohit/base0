import { createRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useCreateProject, useProjects } from '@/hooks/use-projects';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <DashboardLayout>
      <ProjectsDashboard />
    </DashboardLayout>
  ),
});

function ProjectsDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    await createProject.mutateAsync({ name: newProjectName });
    setNewProjectName('');
    setShowCreate(false);
  };

  if (authLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-4xl font-bold mb-4">Welcome to Base0</h1>
        <p className="text-muted-foreground mb-8">Please log in to access your projects</p>
        <Link to="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {showCreate && (
        <div className="border border-border rounded-lg p-6 bg-card space-y-4">
          <h2 className="text-xl font-semibold">Create New Project</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="flex-1 px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Link
            key={project.id}
            to="/projects/$projectId/collections"
            params={{ projectId: project.id }}
            className="border border-border rounded-lg p-6 bg-card hover:border-primary transition-colors block"
          >
            <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Role: <span className="capitalize">{project.role}</span>
            </p>
            <div className="text-xs text-muted-foreground">
              {project.createdAt && new Date(project.createdAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>

      {projects?.length === 0 && !showCreate && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No projects yet</p>
          <Button onClick={() => setShowCreate(true)}>Create your first project</Button>
        </div>
      )}
    </div>
  );
}
