import {z} from 'zod';

import {ISource} from './../../../schemas/models/source';
import {SourceSchema} from './../../../types/schemas/models';
import {zodOptionalBoolean} from './utils';

export const CreateSourceParamsSchema = SourceSchema.omit({id: true});

export const GetAllSourcesParamsSchema = z
    .object({
        page: z.string().optional(),
        limit: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.string().optional(),
        notInThePreparedVideos: zodOptionalBoolean(),
    })
    .strict();

export const GetOneSourceParamsSchema = z
    .object({
        id: z.number().optional(),
        random: z.boolean().optional(),
        emptyFirebaseUrl: z.boolean().optional(),
    })
    .strict();

export const UpdateSourceParamsSchema = SourceSchema.partial()
    .extend({
        id: z.number(),
    })
    .strict();

export const DeleteSourceParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const GetSourceByIdParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const SourceStatisticsParamsSchema = z
    .object({
        days: z.array(z.string()),
    })
    .strict();

// types

export type CreateSourceParams = Omit<ISource, 'id'>;
export type CreateSourceResponse = ISource;

export type GetAllSourcesParams = z.infer<typeof GetAllSourcesParamsSchema>;
export type GetAllSourcesResponse = {sources: ISource[]; count: number};

export type GetOneSourceParams = z.infer<typeof GetOneSourceParamsSchema>;
export type GetOneSourceResponse = ISource | undefined;

export type UpdateSourceParams = z.infer<typeof UpdateSourceParamsSchema>;
export type UpdateSourceResponse = ISource;

export type DeleteSourceParams = z.infer<typeof DeleteSourceParamsSchema>;
export type DeleteSourceResponse = number;

export type GetSourceByIdParams = z.infer<typeof GetSourceByIdParamsSchema>;
export type GetSourceByIdResponse = ISource | undefined;

export type SourceStatisticsParams = z.infer<typeof SourceStatisticsParamsSchema>;
export type SourceStatisticsResponse = Record<string, number>;
