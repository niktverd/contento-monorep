import {z} from 'zod';

export const PublishIntagramV4Schema = z.object({});
export const PublishIntagramV4ResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
});

export type PublishIntagramV4PostParams = z.infer<typeof PublishIntagramV4Schema>;
export type PublishIntagramV4PostResponse = z.infer<typeof PublishIntagramV4ResponseSchema>;
