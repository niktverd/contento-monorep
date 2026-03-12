export const queryToNumberArray = (val: unknown): number[] | undefined => {
    if (val === null || val === undefined) {
        return undefined;
    }
    if (val === '') {
        return [];
    }
    if (Array.isArray(val)) {
        return val.map(Number).filter((n) => !isNaN(n));
    }
    if (typeof val === 'string') {
        return [Number(val)].filter((n) => !isNaN(n));
    }
    if (typeof val === 'number') {
        return [val];
    }
    return [];
};

export const queryToBoolean = (val: unknown): boolean | undefined => {
    if (val === null || val === undefined) {
        return undefined;
    }
    if (typeof val === 'boolean') {
        return val;
    }
    if (typeof val === 'string') {
        const lower = val.toLowerCase();
        if (lower === 'true' || lower === '1') {
            return true;
        }
        if (lower === 'false' || lower === '0') {
            return false;
        }
    }
    if (typeof val === 'number') {
        return val !== 0;
    }
    return undefined;
};

export const queryToNumber = (val: unknown): number | undefined => {
    if (typeof val === 'number') {
        return val;
    }

    const num = Number(val);
    if (isNaN(num)) {
        return undefined;
    }

    return num;
};

export const queryToNumberStrict = (val: unknown): number => {
    if (typeof val === 'number') {
        return val;
    }

    const num = Number(val);
    if (isNaN(num)) {
        throw new Error('Invalid number');
    }

    return num;
};

export const queryToStringArray = (val: unknown): string[] => {
    if (!val) {
        return [];
    }
    if (Array.isArray(val)) {
        return val.map(String);
    }
    if (typeof val === 'string') {
        return [val];
    }
    return [String(val)];
};
