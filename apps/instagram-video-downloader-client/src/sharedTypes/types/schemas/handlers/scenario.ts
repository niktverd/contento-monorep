import {z} from 'zod';

import {IScenario} from './../../../schemas/models/scenario';
import {ScenarioType} from './../../../types/enums';
import {ScenarioSchema} from './../../../types/schemas/models';

export const CreateScenarioParamsSchema = ScenarioSchema.omit({id: true});

export const GetScenarioByIdParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const GetScenarioBySlugParamsSchema = z
    .object({
        slug: z.string(),
    })
    .strict();

export const GetAllScenariosParamsSchema = z.object({}).strict();

export const UpdateScenarioParamsSchema = ScenarioSchema.partial()
    .extend({
        id: z.number(),
    })
    .strict();

export const DeleteScenarioParamsSchema = z
    .object({
        id: z.number(),
    })
    .strict();

export const scenarioBaseSchema = ScenarioSchema.strip();

// export const scenarioAddBannerAtTheEndSchema = scenarioBaseSchema.extend({
//     type: z.literal(ScenarioType.ScenarioAddBannerAtTheEnd),
//     extraBannerUrl: z.string(),
// });

export const scenarioAddBannerAtTheEndUniqueSchema = scenarioBaseSchema.extend({
    type: z.literal(ScenarioType.ScenarioAddBannerAtTheEndUnique),
    options: z.object({
        extraBannerUrl: z.string(),
        extraBannerUrls: z.array(z.string()),
    }),
});

// export const scenarioShortifySchema = scenarioBaseSchema.extend({
//     type: z.literal(ScenarioType.ScenarioShortify),
//     extraBannerUrls: z.array(z.string()),
//     minDuration: z.number(),
//     maxDuration: z.number(),
// });

export const scenarioShortifyUniqueSchema = scenarioBaseSchema.extend({
    type: z.literal(ScenarioType.ScenarioShortifyUnique),
    options: z.object({
        minDuration: z.number(),
        maxDuration: z.number(),
        extraBannerUrls: z.array(z.string()),
    }),
});

// export const scenarioCoverWithImageSchema = scenarioBaseSchema.extend({
//     type: z.literal(ScenarioType.ScenarioCoverWithImage),
//     imageUrl: z.string(),
//     imageTop: z.number(),
//     imageLeft: z.number(),
//     imageWidth: z.number(),
//     imageHeight: z.number(),
//     videoTop: z.number(),
//     videoLeft: z.number(),
//     videoWidth: z.number(),
//     videoHeight: z.number(),
// });

// export const scenarioLongVideoWithInjectionsSchema = scenarioBaseSchema.extend({
//     type: z.literal(ScenarioType.ScenarioLongVideoWithInjections),
//     adsBannerUrl: z.string(),
//     startBannerUrl: z.string(),
//     injections: z.array(z.string()),
//     limit: z.number(),
// });

export const scenarioCoverWithGreenUniqueSchema = scenarioBaseSchema.extend({
    type: z.literal(ScenarioType.ScenarioCoverWithGreenUnique),
    options: z.object({
        greenVideoUrls: z.array(z.string()),
        whereToPutGreen: z.enum(['start', 'middle', 'end']),
        loopGreen: z.enum(['once', 'loop', 'random']),
    }),
});

// types

export type ScenarioBase = z.infer<typeof scenarioBaseSchema>;
// export type ScenarioAddBannerAtTheEnd = z.infer<typeof scenarioAddBannerAtTheEndSchema>;
export type ScenarioAddBannerAtTheEndUnique = z.infer<typeof scenarioAddBannerAtTheEndUniqueSchema>;
// export type ScenarioShortify = z.infer<typeof scenarioShortifySchema>;
export type ScenarioShortifyUnique = z.infer<typeof scenarioShortifyUniqueSchema>;
export type ScenarioCoverWithGreenUnique = z.infer<typeof scenarioCoverWithGreenUniqueSchema>;
// export type ScenarioLongVideoWithInjections = z.infer<typeof scenarioLongVideoWithInjectionsSchema>;

export type ScenarioV4 =
    | ScenarioAddBannerAtTheEndUnique
    | ScenarioShortifyUnique
    | ScenarioCoverWithGreenUnique;
// | ScenarioCoverWithImage;

// DB Types
export type CreateScenarioParams = Omit<IScenario, 'id'>;
export type CreateScenarioResponse = IScenario;

export type GetScenarioByIdParams = z.infer<typeof GetScenarioByIdParamsSchema>;
export type GetScenarioByIdResponse = IScenario;

export type GetScenarioBySlugParams = z.infer<typeof GetScenarioBySlugParamsSchema>;
export type GetScenarioBySlugResponse = IScenario;

export type GetAllScenariosParams = z.infer<typeof GetAllScenariosParamsSchema>;
export type GetAllScenariosResponse = IScenario[];

export type UpdateScenarioParams = z.infer<typeof UpdateScenarioParamsSchema>;
export type UpdateScenarioResponse = IScenario;

export type DeleteScenarioParams = z.infer<typeof DeleteScenarioParamsSchema>;
export type DeleteScenarioResponse = number;
