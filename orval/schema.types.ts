export type Schema = {
	type?: string;
	enum?: string[];
	description?: string;
	properties?: Record<string, Schema>;
	items?: Schema;
	additionalProperties?: Schema | boolean;
	allOf?: Schema[];
	anyOf?: Schema[];
	oneOf?: Schema[];
};
