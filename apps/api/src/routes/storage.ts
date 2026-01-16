import { db } from '@base0/db';
import { buckets, files, projects } from '@base0/db/schema';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { type Context, Hono, type Next } from 'hono';
import { z } from 'zod';
import { getStorageProvider } from '../lib/storage';
import { authMiddleware, getAuthContext } from '../middleware/auth';
import type { AuthVariables } from '../types';

const storage = new Hono<{ Variables: AuthVariables }>();

// Validation schemas
const createBucketSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100),
  enabled: z.boolean().optional().default(true),
  maxFileSize: z.string().optional(),
  allowedExtensions: z.array(z.string()).optional(),
});

/**
 * Middleware to verify project access for storage
 */
const checkProjectAccess = async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
  const auth = getAuthContext(c);
  // Support both body and param for projectId
  const body = (await c.req.parseBody().catch(() => ({}))) as Record<string, unknown>;
  const json = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId =
    (c.req.param('projectId') as string | undefined) ||
    (json.projectId as string | undefined) ||
    (body.projectId as string | undefined);

  if (!projectId) {
    return c.json({ error: 'Project ID is required' }, 400);
  }

  if (auth.authType === 'apiKey') {
    if (auth.projectId !== projectId) {
      return c.json({ error: 'Unauthorized: API Key is not valid for this project' }, 403);
    }
  } else {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, auth.userId ?? '')))
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found or unauthorized' }, 404);
    }
  }

  return next();
};

/**
 * GET /v1/storage/buckets
 * List all buckets in a project
 */
storage.get('/buckets', authMiddleware, checkProjectAccess, async (c) => {
  const projectId = c.req.query('projectId');
  if (!projectId) return c.json({ error: 'projectId is required' }, 400);

  const results = await db.select().from(buckets).where(eq(buckets.projectId, projectId));
  return c.json({ buckets: results });
});

/**
 * POST /v1/storage/buckets
 * Create a new storage bucket
 */
storage.post(
  '/buckets',
  authMiddleware,
  zValidator('json', createBucketSchema),
  checkProjectAccess,
  async (c) => {
    const data = c.req.valid('json');

    const [newBucket] = await db.insert(buckets).values(data).returning();
    return c.json({ message: 'Bucket created successfully', bucket: newBucket }, 201);
  },
);

/**
 * POST /v1/storage/buckets/:bucketId/files
 * Upload a file to a bucket
 */
storage.post('/buckets/:bucketId/files', authMiddleware, async (c) => {
  const bucketId = c.req.param('bucketId');
  const body = await c.req.parseBody();
  const fileData = body.file as File;

  if (!fileData) {
    return c.json({ error: 'No file uploaded' }, 400);
  }

  // 1. Verify bucket exists and we have access
  const [bucket] = await db.select().from(buckets).where(eq(buckets.id, bucketId)).limit(1);

  if (!bucket) {
    return c.json({ error: 'Bucket not found' }, 404);
  }

  // TODO: Verify project access for bucket

  try {
    const storageProvider = await getStorageProvider();
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique path: bucketId/fileId_name
    const fileId = crypto.randomUUID();
    const storagePath = `${bucketId}/${fileId}_${fileData.name}`;

    await storageProvider.upload(storagePath, buffer, fileData.type);

    const [newFile] = await db
      .insert(files)
      .values({
        id: fileId,
        bucketId,
        name: fileData.name,
        size: String(fileData.size),
        mimeType: fileData.type,
        path: storagePath,
      })
      .returning();

    return c.json({ message: 'File uploaded successfully', file: newFile }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

/**
 * GET /v1/storage/buckets/:bucketId/files/:fileId/view
 * View/Download a file
 */
storage.get('/buckets/:bucketId/files/:fileId/view', async (c) => {
  const { fileId } = c.req.param();

  const [fileDoc] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!fileDoc) return c.json({ error: 'File not found' }, 404);

  try {
    const storageProvider = await getStorageProvider();
    const data = await storageProvider.download(fileDoc.path);

    return c.body(data.buffer as ArrayBuffer, 200, {
      'Content-Type': fileDoc.mimeType,
      'Content-Length': fileDoc.size,
    });
  } catch (error) {
    console.error('Download error:', error);
    return c.json({ error: 'Failed to retrieve file' }, 500);
  }
});

export default storage;
