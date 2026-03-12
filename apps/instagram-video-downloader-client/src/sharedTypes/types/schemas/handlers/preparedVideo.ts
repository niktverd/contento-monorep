import {z} from 'zod';

import {IPreparedVideo} from './../../../schemas/models/preparedVideo';
import {PreparedVideoSchema} from './../../../types/schemas/models';
import {
    zodOptionalBoolean,
    zodOptionalNumber,
    zodOptionalNumberArray,
    zodStringArray,
} from './utils';

export const CreatePreparedVideoParamsSchema = PreparedVideoSchema.omit({id: true});

export const GetPreparedVideoByIdParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const GetAllPreparedVideosParamsSchema = z
    .object({
        page: z.string().optional(),
        limit: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.string().optional(),
        scenarioIds: zodOptionalNumberArray(),
        sourceIds: zodOptionalNumberArray(),
        accountIds: zodOptionalNumberArray(),
        findDuplicates: zodOptionalBoolean(),
    })
    .strict();

export const UpdatePreparedVideoParamsSchema = CreatePreparedVideoParamsSchema.partial()
    .extend({
        id: z.number(),
    })
    .strict();

export const DeletePreparedVideoParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const GetOnePreparedVideoParamsSchema = z
    .object({
        hasFirebaseUrl: zodOptionalBoolean(),
        firebaseUrl: z.string().optional(),
        duration: zodOptionalNumber(),
        scenarioId: zodOptionalNumber(),
        sourceId: zodOptionalNumber(),
        accountId: zodOptionalNumber(),
        random: zodOptionalBoolean(),
        notInInstagramMediaContainers: zodOptionalBoolean(),
        fetchGraphAccount: zodOptionalBoolean(),
        fetchGraphScenario: zodOptionalBoolean(),
        fetchGraphSource: zodOptionalBoolean(),
    })
    .strict();

export const FindPreparedVideoDuplicatesParamsSchema = z
    .object({
        accountId: zodOptionalNumber(),
        sourceId: zodOptionalNumber(),
        scenarioId: zodOptionalNumber(),
    })
    .strict();

export const PreparedVideosStatisticsParamsSchema = z
    .object({
        days: zodStringArray(),
    })
    .strict();

export const HasPreparedVideoBeenCreatedParamsSchema = z
    .object({
        accountId: zodOptionalNumber(),
        scenarioId: zodOptionalNumber(),
        sourceId: zodOptionalNumber(),
    })
    .strict();

export const HasPreparedVideoBeenCreatedResponseSchema = z.boolean();

// types

export type CreatePreparedVideoParams = Omit<IPreparedVideo, 'id'>;
export type CreatePreparedVideoResponse = IPreparedVideo;

export type GetPreparedVideoByIdParams = z.infer<typeof GetPreparedVideoByIdParamsSchema>;
export type GetPreparedVideoByIdResponse = IPreparedVideo;

export type GetAllPreparedVideosParams = z.infer<typeof GetAllPreparedVideosParamsSchema>;
export type GetAllPreparedVideosResponse = {
    preparedVideos: IPreparedVideo[];
    count: number;
};

export type UpdatePreparedVideoParams = z.infer<typeof UpdatePreparedVideoParamsSchema>;
export type UpdatePreparedVideoResponse = IPreparedVideo;

export type DeletePreparedVideoParams = z.infer<typeof DeletePreparedVideoParamsSchema>;
export type DeletePreparedVideoResponse = number;

export type GetOnePreparedVideoParams = z.infer<typeof GetOnePreparedVideoParamsSchema>;
export type GetOnePreparedVideoResponse = IPreparedVideo | undefined;

export type FindPreparedVideoDuplicatesParams = z.infer<
    typeof FindPreparedVideoDuplicatesParamsSchema
>;
export type FindPreparedVideoDuplicatesResponse = IPreparedVideo[];

export type PreparedVideosStatisticsParams = z.infer<typeof PreparedVideosStatisticsParamsSchema>;
export type PreparedVideosStatisticsResponse = Record<string, number>;

export type HasPreparedVideoBeenCreatedParams = z.infer<
    typeof HasPreparedVideoBeenCreatedParamsSchema
>;
export type HasPreparedVideoBeenCreatedResponse = z.infer<
    typeof HasPreparedVideoBeenCreatedResponseSchema
>;
