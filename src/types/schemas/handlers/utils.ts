import {z} from 'zod';

import {
    queryToBoolean,
    queryToNumber,
    queryToNumberArray,
    queryToNumberStrict,
    queryToStringArray,
} from '#src/types/schemas/helpers';

export const zodOptionalNumber = () =>
    z
        .preprocess(queryToNumber, z.number())
        .optional()
        .transform((x) => (x === undefined ? undefined : (x as number))) as unknown as z.ZodType<
        number | undefined
    >;

export const zodNumber = () =>
    z
        .preprocess(queryToNumberStrict, z.number())
        .transform((x) => x as number) as unknown as z.ZodType<number>;

export const zodOptionalNumberArray = () =>
    z
        .preprocess(queryToNumberArray, z.array(z.number()))
        .optional()
        .transform((x) => (x === undefined ? undefined : (x as number[]))) as unknown as z.ZodType<
        number[] | undefined
    >;

export const zodOptionalBoolean = () =>
    z
        .preprocess(queryToBoolean, z.boolean())
        .optional()
        .transform((x) => (x === undefined ? undefined : (x as boolean))) as unknown as z.ZodType<
        boolean | undefined
    >;

export const zodStringArray = () =>
    z
        .preprocess(queryToStringArray, z.array(z.string()))
        .transform((x) => x as string[]) as unknown as z.ZodType<string[]>;
