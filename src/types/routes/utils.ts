type PrefixedRoutes<T extends Record<string, string>, Prefix extends string> = {
    [K in keyof T]: `${Prefix}${T[K]}`;
};

// Then update your getFullRoutes return type
export const getFullRoutes = <T extends Record<string, string>, Prefix extends string>({
    rootName,
    routes,
    prefix = '/api',
}: {
    rootName: Prefix;
    routes: T;
    prefix?: string;
}): PrefixedRoutes<T, Prefix> => {
    const newObject = {} as PrefixedRoutes<T, Prefix>;
    for (const [key, value] of Object.entries(routes)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newObject as any)[key] = `${prefix}${rootName}${value}`;
    }

    return newObject;
};
