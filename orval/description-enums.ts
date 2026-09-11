import type { InputTransformerFn } from 'orval';
import { injectSchemaEnums } from './inject-schema-enums';
import type { Schema } from './schema.types';

export const descriptionEnumsTransformer: InputTransformerFn = (spec) => {
	const schemas = (spec.components?.schemas ?? {}) as Record<string, Schema>;
	for (const schema of Object.values(schemas)) injectSchemaEnums(schema);
	return spec;
};
