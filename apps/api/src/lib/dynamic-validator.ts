import { z } from 'zod';

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'json';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
}

export interface SchemaDefinition {
  fields: FieldDefinition[];
}

/**
 * Creates a dynamic Zod schema from a Collection's schema definition
 */
export function createDynamicSchema(schemaDef: SchemaDefinition) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of schemaDef.fields) {
    let validator: z.ZodTypeAny;

    switch (field.type) {
      case 'string':
        validator = z.string();
        break;
      case 'number':
        validator = z.number();
        break;
      case 'boolean':
        validator = z.boolean();
        break;
      case 'date':
        validator = z.string().datetime(); // Store as ISO string
        break;
      case 'email':
        validator = z.string().email();
        break;
      case 'url':
        validator = z.string().url();
        break;
      case 'json':
        validator = z.record(z.unknown());
        break;
      default:
        validator = z.unknown();
    }

    if (!field.required) {
      validator = validator.optional().nullable();
    }

    shape[field.name] = validator;
  }

  return z.object(shape);
}
