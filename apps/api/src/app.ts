import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import auth from './routes/auth';
import collections from './routes/collections';
import documents from './routes/documents';
import keys from './routes/keys';
import projects from './routes/projects';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  }),
);

// Health check
app.get('/health', (c) => c.text('OK'));

// API v1 routes
const v1 = new Hono();
v1.route('/auth', auth);
v1.route('/projects', projects);
v1.route('/collections', collections);
v1.route('/collections', documents);
v1.route('/keys', keys);

// Root info
v1.get('/', (c) => {
  return c.json({
    name: 'Base0 API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/v1/auth',
      projects: '/v1/projects',
      collections: '/v1/collections',
      documents: '/v1/collections/:id/documents',
      health: '/health',
    },
  });
});

app.route('/v1', v1);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500,
  );
});

export default app;
