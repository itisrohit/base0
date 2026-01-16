import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => {
  return c.json({
    name: 'Base0 API',
    version: '0.1.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => c.text('OK'));

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
};
