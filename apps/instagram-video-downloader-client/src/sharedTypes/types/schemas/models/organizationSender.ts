import {z} from 'zod';

import {createEntitySchema} from './base';

export const OrganizationSenderSchema = createEntitySchema({
    senderId: z.string(),
    organizationId: z.number(),
});

export type IOrganizationSender = z.infer<typeof OrganizationSenderSchema>;
