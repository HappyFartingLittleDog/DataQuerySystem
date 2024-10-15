export function isRecord(maybeRecord: unknown): maybeRecord is Record<string, unknown> {
	return maybeRecord !== null && maybeRecord !== undefined
		&& typeof maybeRecord === "object" && !Array.isArray(maybeRecord);
}

export function isStringArray(maybeStringArray: unknown): maybeStringArray is string[] {
	if (!Array.isArray(maybeStringArray)) {
		return false;
	}

	return maybeStringArray.every((v) => typeof v === "string");
}

export function isString(maybeString: unknown): maybeString is string {
	return typeof maybeString === "string";
}
