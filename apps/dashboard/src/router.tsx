import { createRouter } from '@tanstack/react-router';
import { queryClient } from '@/lib/query-client';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { loginRoute } from './routes/login';
import { projectCollectionsRoute } from './routes/projects.$projectId.collections';
import { projectCollectionDataRoute } from './routes/projects.$projectId.collections.$collectionId';
import { projectKeysRoute } from './routes/projects.$projectId.keys';

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  projectKeysRoute,
  projectCollectionsRoute,
  projectCollectionDataRoute,
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
