import {z} from 'zod';

export const BaseEntitySchema = z.object({
    id: z.number(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
    organizationId: z.number().optional(),
});

export const createEntitySchema = <T extends z.ZodRawShape>(shape: T) =>
    BaseEntitySchema.extend(shape);
