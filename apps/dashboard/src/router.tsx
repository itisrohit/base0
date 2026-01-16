import { createRouter } from '@tanstack/react-router';
import { queryClient } from '@/lib/query-client';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { loginRoute } from './routes/login';
import { projectCollectionsRoute } from './routes/projects.$projectId.collections';
import { projectCollectionDataRoute } from './routes/projects.$projectId.collections.$collectionId';
import { projectKeysRoute } from './routes/projects.$projectId.keys';
import { projectMembersRoute } from './routes/projects.$projectId.members';
import { projectSettingsRoute } from './routes/projects.$projectId.settings';
import { projectStorageRoute } from './routes/projects.$projectId.storage';
import { projectUsageRoute } from './routes/projects.$projectId.usage';

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  projectKeysRoute,
  projectCollectionsRoute,
  projectCollectionDataRoute,
  projectMembersRoute,
  projectSettingsRoute,
  projectStorageRoute,
  projectUsageRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
