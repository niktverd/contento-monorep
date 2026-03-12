import {z} from 'zod';

import {createEntitySchema} from './base';

export const OrganizationSchema = createEntitySchema({
    name: z.string(),
});

export type IOrganization = z.infer<typeof OrganizationSchema>;
