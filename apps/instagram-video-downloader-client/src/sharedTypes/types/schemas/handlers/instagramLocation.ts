import {z} from 'zod';

import {IInstagramLocation} from './../../../schemas/models/instagram-location';
import {InstagramLocationSchema} from './../../../types/schemas/models';

export const CreateInstagramLocationParamsSchema = InstagramLocationSchema.omit({
    id: true,
});

export const GetInstagramLocationByIdParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const GetAllInstagramLocationsParamsSchema = z
    .object({
        page: z.string().optional(),
        limit: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.string().optional(),
        groupTextFilter: z.string().optional(),
        commonTextFilter: z.string().optional(),
    })
    .strict();

export const UpdateInstagramLocationParamsSchema = CreateInstagramLocationParamsSchema.partial()
    .extend({
        id: z.number(),
    })
    .strict();

export const DeleteInstagramLocationParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

// types

export type CreateInstagramLocationParams = z.infer<typeof CreateInstagramLocationParamsSchema>;
export type CreateInstagramLocationResponse = IInstagramLocation;

export type GetInstagramLocationByIdParams = z.infer<typeof GetInstagramLocationByIdParamsSchema>;
export type GetInstagramLocationByIdResponse = IInstagramLocation;

export type GetAllInstagramLocationsParams = z.infer<typeof GetAllInstagramLocationsParamsSchema>;
export type GetAllInstagramLocationsResponse = {
    locations: IInstagramLocation[];
    count: number;
};

export type UpdateInstagramLocationParams = z.infer<typeof UpdateInstagramLocationParamsSchema>;
export type UpdateInstagramLocationResponse = IInstagramLocation;

export type DeleteInstagramLocationParams = z.infer<typeof DeleteInstagramLocationParamsSchema>;
export type DeleteInstagramLocationResponse = number;
