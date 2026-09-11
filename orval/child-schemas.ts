import type { Schema } from './schema.types';

export const childSchemas = (schema: Schema): Schema[] => {
	const children: Schema[] = [];
	if (schema.properties) children.push(...Object.values(schema.properties));
	if (schema.items) children.push(schema.items);
	if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
		children.push(schema.additionalProperties);
	}
	for (const group of [schema.allOf, schema.anyOf, schema.oneOf]) {
		if (group) children.push(...group);
	}
	return children;
};
