/**
 * Recursively omits specific fields from an object and all its nested objects
 * @param obj - The object to clean
 * @param fieldsToOmit - Array of field names to remove
 * @returns A new object without the specified fields
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deepOmit = <T extends Record<string, any>>(obj: T, fieldsToOmit: string[]): T => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map((item) => deepOmit(item, fieldsToOmit)) as unknown as T;
    }

    // Handle objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {};

    Object.keys(obj).forEach((key) => {
        // Skip fields that should be omitted
        if (fieldsToOmit.includes(key)) {
            return;
        }

        // Recursively process nested objects
        const value = obj[key];
        if (value && typeof value === 'object') {
            result[key] = deepOmit(value, fieldsToOmit);
        } else {
            result[key] = value;
        }
    });

    return result as T;
};
