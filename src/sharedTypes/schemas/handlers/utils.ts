import {z} from 'zod';

import {
    queryToBoolean,
    queryToNumber,
    queryToNumberArray,
    queryToNumberStrict,
    queryToStringArray,
} from './../../types/schemas/helpers';

export const zodOptionalNumber = () => z.preprocess(queryToNumber, z.number().optional());

export const zodNumber = () => z.preprocess(queryToNumberStrict, z.number());

export const zodOptionalNumberArray = () =>
    z.preprocess(queryToNumberArray, z.array(z.number()).optional());

export const zodOptionalBoolean = () => z.preprocess(queryToBoolean, z.boolean().optional());

export const zodStringArray = () => z.preprocess(queryToStringArray, z.array(z.string()));
