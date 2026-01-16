import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import type { AuthVariables } from '../types';

const usageRoute = new Hono<{ Variables: AuthVariables }>();

usageRoute.get('/', authMiddleware, requirePermission('project:read'), async (c) => {
  // Mock telemetry data
  const usage = {
    requests: [
      { date: '2024-01-01', count: 120 },
      { date: '2024-01-02', count: 150 },
      { date: '2024-01-03', count: 180 },
      { date: '2024-01-04', count: 140 },
      { date: '2024-01-05', count: 200 },
      { date: '2024-01-06', count: 250 },
      { date: '2024-01-07', count: 220 },
    ],
    storage: {
      used: 450, // MB
      limit: 1000, // MB
    },
    database: {
      documents: 1250,
      collections: 8,
    },
  };

  return c.json({ usage });
});

export default usageRoute;
