import { documents } from '@base0/db/schema';
import { and, type SQL, sql } from 'drizzle-orm';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Parses URL query parameters into Drizzle-compatible filters for JSONB data
 */
export function parseFilters(query: Record<string, unknown>): SQL | undefined {
  const conditions: SQL[] = [];

  for (const [key, value] of Object.entries(query)) {
    // Skip reserved keys
    if (['limit', 'offset', 'sort', 'order', 'projectId', 'collectionId'].includes(key)) continue;

    let field = key;
    let operator = 'eq';

    const match = key.match(/^(.+)\[(.+)\]$/);
    if (match) {
      field = match[1];
      operator = match[2];
    }

    // PostgreSQL JSONB data extraction
    // Treat as text for now, but we might want to cast for numbers/booleans
    const jsonField = sql`${documents.data}->>${field}`;

    switch (operator) {
      case 'eq':
        conditions.push(sql`${jsonField} = ${value}`);
        break;
      case 'ne':
        conditions.push(sql`${jsonField} != ${value}`);
        break;
      case 'gt':
        conditions.push(sql`${jsonField} > ${value}`);
        break;
      case 'gte':
        conditions.push(sql`${jsonField} >= ${value}`);
        break;
      case 'lt':
        conditions.push(sql`${jsonField} < ${value}`);
        break;
      case 'lte':
        conditions.push(sql`${jsonField} <= ${value}`);
        break;
      case 'contains':
        conditions.push(sql`${jsonField} ILIKE ${`%%${value}%%`}`);
        break;
      case 'in': {
        const values = String(value).split(',');
        conditions.push(sql`${jsonField} IN (${sql.join(values, sql`, `)})`);
        break;
      }
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Parses limit and offset from query
 */
export function parsePagination(query: Record<string, unknown>): QueryOptions {
  const limitValue = Number(query.limit) || 25;
  const offsetValue = Number(query.offset) || 0;
  const sort = (query.sort as string) || 'createdAt';
  const order = (query.order as string) === 'asc' ? 'asc' : 'desc';

  return {
    limit: Math.min(limitValue, 100), // Max 100
    offset: offsetValue,
    sort,
    order,
  };
}
