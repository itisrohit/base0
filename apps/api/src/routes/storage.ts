import { db } from '@base0/db';
import { buckets, files, projectMembers } from '@base0/db/schema';
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
  let projectId = c.req.param('projectId') || c.req.query('projectId');

  if (!projectId && c.req.method !== 'GET') {
    const contentType = c.req.header('content-type');
    if (contentType?.includes('application/json')) {
      const json = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
      projectId = json.projectId as string | undefined;
    } else if (contentType?.includes('multipart/form-data')) {
      const body = (await c.req.parseBody().catch(() => ({}))) as Record<string, unknown>;
      projectId = body.projectId as string | undefined;
    }
  }

  if (!projectId) {
    return c.json({ error: 'Project ID is required' }, 400);
  }

  if (auth.authType === 'apiKey') {
    if (auth.projectId !== projectId) {
      return c.json({ error: 'Unauthorized: API Key is not valid for this project' }, 403);
    }
  } else {
    const [membership] = await db
      .select()
      .from(projectMembers)
      .where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, auth.userId ?? '')),
      )
      .limit(1);

    if (!membership) {
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
 * GET /v1/storage/buckets/:bucketId/files
 * List all files in a bucket
 */
storage.get('/buckets/:bucketId/files', authMiddleware, async (c) => {
  const bucketId = c.req.param('bucketId');

  const [bucket] = await db.select().from(buckets).where(eq(buckets.id, bucketId)).limit(1);

  if (!bucket) {
    return c.json({ error: 'Bucket not found' }, 404);
  }

  const results = await db.select().from(files).where(eq(files.bucketId, bucketId));
  return c.json({ files: results });
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

/**
 * DELETE /v1/storage/buckets/:bucketId/files/:fileId
 * Delete a file
 */
storage.delete('/buckets/:bucketId/files/:fileId', authMiddleware, async (c) => {
  const { bucketId, fileId } = c.req.param();

  const [fileDoc] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.bucketId, bucketId)))
    .limit(1);

  if (!fileDoc) return c.json({ error: 'File not found' }, 404);

  try {
    const storageProvider = await getStorageProvider();
    await storageProvider.delete(fileDoc.path);

    await db.delete(files).where(eq(files.id, fileId));

    return c.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

/**
 * DELETE /v1/storage/buckets/:bucketId
 * Delete a storage bucket
 */
storage.delete('/buckets/:bucketId', authMiddleware, checkProjectAccess, async (c) => {
  const { bucketId } = c.req.param();

  // Check if bucket has files
  const existingFiles = await db.select().from(files).where(eq(files.bucketId, bucketId)).limit(1);

  if (existingFiles.length > 0) {
    return c.json({ error: 'Cannot delete bucket with files. Delete all files first.' }, 400);
  }

  await db.delete(buckets).where(eq(buckets.id, bucketId));

  return c.json({ message: 'Bucket deleted successfully' });
});

export default storage;
