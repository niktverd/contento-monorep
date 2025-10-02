import {z} from 'zod';

import {IInstagramMediaContainer} from './../../../schemas/models/instagramMediaContainer';
import {InstagramMediaContainerSchema} from './../../../types/schemas/models';

export const CreateInstagramMediaContainerParamsSchema = InstagramMediaContainerSchema.omit({
    id: true,
});

export const GetInstagramMediaContainerByIdParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const GetAllInstagramMediaContainersParamsSchema = z
    .object({
        page: z.string().optional(),
        limit: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.string().optional(),
    })
    .strict();

export const UpdateInstagramMediaContainerParamsSchema =
    CreateInstagramMediaContainerParamsSchema.partial()
        .extend({
            id: z.number(),
        })
        .strict();

export const DeleteInstagramMediaContainerParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const GetLimitedInstagramMediaContainersParamsSchema = z
    .object({
        accountId: z.number().optional(),
        limit: z.number().optional(),
        notPublished: z.boolean().optional(),
        random: z.boolean().optional(),
        isBlocked: z.boolean().optional(),
    })
    .strict();

export const InstagramMediaContainersStatisticsParamsSchema = z
    .object({
        days: z.array(z.string()),
    })
    .strict();

// types

export type CreateInstagramMediaContainerParams = Omit<IInstagramMediaContainer, 'id'>;
export type CreateInstagramMediaContainerResponse = IInstagramMediaContainer;

export type GetInstagramMediaContainerByIdParams = z.infer<
    typeof GetInstagramMediaContainerByIdParamsSchema
>;
export type GetInstagramMediaContainerByIdResponse = IInstagramMediaContainer;

export type GetAllInstagramMediaContainersParams = z.infer<
    typeof GetAllInstagramMediaContainersParamsSchema
>;
export type GetAllInstagramMediaContainersResponse = {
    mediaContainers: IInstagramMediaContainer[];
    count: number;
};

export type UpdateInstagramMediaContainerParams = z.infer<
    typeof UpdateInstagramMediaContainerParamsSchema
>;
export type UpdateInstagramMediaContainerResponse = IInstagramMediaContainer;

export type DeleteInstagramMediaContainerParams = z.infer<
    typeof DeleteInstagramMediaContainerParamsSchema
>;
export type DeleteInstagramMediaContainerResponse = number;

export type GetLimitedInstagramMediaContainersParams = z.infer<
    typeof GetLimitedInstagramMediaContainersParamsSchema
>;
export type GetLimitedInstagramMediaContainersResponse = IInstagramMediaContainer[];

export type InstagramMediaContainersStatisticsParams = z.infer<
    typeof InstagramMediaContainersStatisticsParamsSchema
>;
export type InstagramMediaContainersStatisticsResponse = Record<string, number>;
