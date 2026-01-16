import { db } from '@base0/db';
import { documents } from '@base0/db/schema';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { createDynamicSchema, type SchemaDefinition } from '../lib/dynamic-validator';
import { parseFilters, parsePagination } from '../lib/query-parser';
import { authMiddleware } from '../middleware/auth';
import { requireResourcePermission } from '../middleware/rbac';
import type { AuthVariables } from '../types';

const documentsRoute = new Hono<{ Variables: AuthVariables }>();

/**
 * GET /v1/collections/:collectionId/documents
 * List all documents in a collection with filtering and pagination
 */
documentsRoute.get(
  '/',
  authMiddleware,
  requireResourcePermission('collection', 'document:read'),
  async (c) => {
    const collectionId = c.req.param('collectionId');
    const query = c.req.query();

    const filters = parseFilters(query);
    const { limit, offset, sort, order } = parsePagination(query);

    try {
      const queryBuilder = db
        .select()
        .from(documents)
        .where(and(eq(documents.collectionId, collectionId), filters))
        .limit(limit ?? 25)
        .offset(offset ?? 0);

      // Sorting logic
      if (sort === 'createdAt') {
        queryBuilder.orderBy(
          order === 'desc' ? desc(documents.createdAt) : asc(documents.createdAt),
        );
      } else if (sort) {
        // Sort by JSONB field
        const jsonSortField = sql`${documents.data} ->> ${sort} `;
        queryBuilder.orderBy(order === 'desc' ? desc(jsonSortField) : asc(jsonSortField));
      }

      const docs = await queryBuilder;

      return c.json({
        documents: docs,
        pagination: {
          limit,
          offset,
          count: docs.length,
        },
      });
    } catch (error) {
      console.error('List documents error:', error);
      return c.json({ error: 'Failed to list documents' }, 500);
    }
  },
);

/**
 * POST /v1/collections/:collectionId/documents
 * Create a new document with dynamic validation
 */
documentsRoute.post(
  '/',
  authMiddleware,
  requireResourcePermission('collection', 'document:create'),
  async (c) => {
    const collectionId = c.req.param('collectionId');
    const collection = c.get('collection');

    if (!collection) {
      return c.json({ error: 'Collection context not found' }, 500);
    }

    const data = await c.req.json();

    try {
      // 1. Build dynamic Zod schema from collection definition
      const dynamicSchema = createDynamicSchema(collection.schemaDef as SchemaDefinition);

      // 2. Validate data against schema
      const validationResult = dynamicSchema.safeParse(data);
      if (!validationResult.success) {
        return c.json(
          {
            error: 'Validation failed',
            details: validationResult.error.flatten(),
          },
          400,
        );
      }

      // 3. Insert document
      const [newDoc] = await db
        .insert(documents)
        .values({
          collectionId,
          data: validationResult.data,
        })
        .returning();

      return c.json(
        {
          message: 'Document created successfully',
          document: newDoc,
        },
        201,
      );
    } catch (error) {
      console.error('Create document error:', error);
      return c.json({ error: 'Failed to create document' }, 500);
    }
  },
);

/**
 * PATCH /v1/collections/:collectionId/documents/:id
 * Partial update of a document
 */
documentsRoute.patch(
  '/:id',
  authMiddleware,
  requireResourcePermission('collection', 'document:update'),
  async (c) => {
    const collectionId = c.req.param('collectionId');
    const docId = c.req.param('id');
    const collection = c.get('collection');

    if (!collection) {
      return c.json({ error: 'Collection context not found' }, 500);
    }

    const data = await c.req.json();

    try {
      // For patch, we make all fields optional in the dynamic schema
      const baseSchema = createDynamicSchema(collection.schemaDef as SchemaDefinition);
      const patchSchema = baseSchema.partial();

      const validationResult = patchSchema.safeParse(data);
      if (!validationResult.success) {
        return c.json(
          {
            error: 'Validation failed',
            details: validationResult.error.flatten(),
          },
          400,
        );
      }

      const [updatedDoc] = await db
        .update(documents)
        .set({
          data: validationResult.data,
        })
        .where(and(eq(documents.id, docId), eq(documents.collectionId, collectionId)))
        .returning();

      if (!updatedDoc) {
        return c.json({ error: 'Document not found' }, 404);
      }

      return c.json({
        message: 'Document updated successfully',
        document: updatedDoc,
      });
    } catch (error) {
      console.error('Update document error:', error);
      return c.json({ error: 'Failed to update document' }, 500);
    }
  },
);

/**
 * DELETE /v1/collections/:collectionId/documents/:id
 * Delete a document
 */
documentsRoute.delete(
  '/:id',
  authMiddleware,
  requireResourcePermission('collection', 'document:delete'),
  async (c) => {
    const collectionId = c.req.param('collectionId');
    const docId = c.req.param('id');

    try {
      const deleted = await db
        .delete(documents)
        .where(and(eq(documents.id, docId), eq(documents.collectionId, collectionId)))
        .returning();

      if (deleted.length === 0) {
        return c.json({ error: 'Document not found' }, 404);
      }

      return c.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Delete document error:', error);
      return c.json({ error: 'Failed to delete document' }, 500);
    }
  },
);

export default documentsRoute;
