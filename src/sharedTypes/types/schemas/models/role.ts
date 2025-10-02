import {z} from 'zod';

import {createEntitySchema} from './base';

export const RoleSchema = createEntitySchema({
    name: z.string(),
    description: z.string(),
    permissions: z.array(z.string()),
}).strict();

export type IRole = z.infer<typeof RoleSchema>;
