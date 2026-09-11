import { childSchemas } from './child-schemas';
import { extractEnumValues } from './extract-enum-values';
import type { Schema } from './schema.types';

export const injectSchemaEnums = (schema: Schema, seen = new Set<Schema>()) => {
	if (!schema || typeof schema !== 'object' || seen.has(schema)) return;
	seen.add(schema);

	if (schema.type === 'string' && !schema.enum) {
		const values = extractEnumValues(schema.description);
		if (values) schema.enum = values;
	}

	for (const child of childSchemas(schema)) injectSchemaEnums(child, seen);
};
