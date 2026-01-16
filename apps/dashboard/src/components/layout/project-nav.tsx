import { Link, useParams } from '@tanstack/react-router';

export function ProjectNav() {
  const { projectId } = useParams({ strict: false });

  if (!projectId) return null;

  return (
    <div className="flex gap-4 border-b border-border pb-4 mb-4">
      <Link
        to="/projects/$projectId/collections"
        params={{ projectId }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground pb-4 -mb-4.5 data-[status=active]:text-primary data-[status=active]:border-b-2 data-[status=active]:border-primary"
      >
        Collections
      </Link>
      <Link
        to="/projects/$projectId/usage"
        params={{ projectId }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground pb-4 -mb-4.5 data-[status=active]:text-primary data-[status=active]:border-b-2 data-[status=active]:border-primary"
      >
        Usage
      </Link>
      <Link
        to="/projects/$projectId/keys"
        params={{ projectId }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground pb-4 -mb-4.5 data-[status=active]:text-primary data-[status=active]:border-b-2 data-[status=active]:border-primary"
      >
        API Keys
      </Link>
      <Link
        to="/projects/$projectId/storage"
        params={{ projectId }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground pb-4 -mb-4.5 data-[status=active]:text-primary data-[status=active]:border-b-2 data-[status=active]:border-primary"
      >
        Storage
      </Link>
      <Link
        to="/projects/$projectId/members"
        params={{ projectId }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground pb-4 -mb-4.5 data-[status=active]:text-primary data-[status=active]:border-b-2 data-[status=active]:border-primary"
      >
        Members
      </Link>
      <Link
        to="/projects/$projectId/settings"
        params={{ projectId }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground pb-4 -mb-4.5 data-[status=active]:text-primary data-[status=active]:border-b-2 data-[status=active]:border-primary"
      >
        Settings
      </Link>
    </div>
  );
}
