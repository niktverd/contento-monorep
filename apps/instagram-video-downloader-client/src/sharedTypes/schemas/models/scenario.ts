import {z} from 'zod';

import {InstagramLocationSource, ScenarioType} from './../../types/enums';
import {createEntitySchema} from './base';
import {InstagramLocationSchema} from './instagram-location';

export const ScenarioSchema = createEntitySchema({
    slug: z.string(),
    type: z.nativeEnum(ScenarioType),
    enabled: z.boolean().optional(),
    onlyOnce: z.boolean().optional(),
    copiedFrom: z.number().nullable().optional(),
    options: z.record(z.string(), z.any()).optional(),
    texts: z.record(z.string(), z.any()).optional(),
    instagramLocationSource: z
        .nativeEnum(InstagramLocationSource)
        .default(InstagramLocationSource.Scenario)
        .optional(),
    organizationId: z.number().optional(),

    // added on request
    instagramLocations: z.array(InstagramLocationSchema).optional(),
}).strict();

export type IScenario = z.infer<typeof ScenarioSchema>;
