import {z} from 'zod';

import {CloudRunCreateScenarioVideoSchema} from './../types/schemas/handlers/cloud-run';

export type CloudRunCreateScenarioVideoParams = z.infer<typeof CloudRunCreateScenarioVideoSchema>;
export type CloudRunCreateScenarioVideoResponse = undefined;
