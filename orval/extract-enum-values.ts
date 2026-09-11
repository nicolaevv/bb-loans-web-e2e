const CAN_BE_ONE_OF = /Can be one of:\s*([\s\S]*)/i;

export const extractEnumValues = (description?: string) => {
	if (!description) return null;
	const match = CAN_BE_ONE_OF.exec(description);
	if (!match) return null;
	const values = match[1]
		.split(/[,;\n]/)
		.map((token) => token.trim().replace(/\.$/, ''))
		.filter((token) => /^[A-Z][A-Z0-9_]*$/.test(token));
	return values.length ? Array.from(new Set(values)) : null;
};
