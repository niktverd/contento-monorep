import {z} from 'zod';

import {createEntitySchema} from './base';

export const UserOrganizationRoleSchema = createEntitySchema({
    userId: z.number(),
    organizationId: z.number(),
    roleId: z.number(),
}).strict();

export type IUserOrganizationRole = z.infer<typeof UserOrganizationRoleSchema>;
