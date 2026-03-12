import {z} from 'zod';

import {IOrganizationSender} from './../../../schemas/models';
import {zodOptionalNumber} from './utils';

export const GetOrganizationsBySenderIdParamsSchema = z.object({
    senderId: z.string(),
});

export const GetOrganizationSendersByOrganizationIdParamsSchema = z.object({
    organizationId: zodOptionalNumber(),
});

export const CreateOrganizationSenderParamsSchema = z.object({
    senderId: z.string(),
    organizationId: z.number(),
});

export const DeleteOrganizationSenderParamsSchema = z.object({
    id: z.number(),
});

// types
export type GetOrganizationIdBySenderIdParams = z.infer<
    typeof GetOrganizationsBySenderIdParamsSchema
>;
export type GetOrganizationIdBySenderIdResponse = IOrganizationSender[];

export type GetOrganizationSendersByOrganizationIdParams = z.infer<
    typeof GetOrganizationSendersByOrganizationIdParamsSchema
>;
export type GetOrganizationSendersByOrganizationIdResponse = IOrganizationSender[];

export type CreateOrganizationSenderParams = z.infer<typeof CreateOrganizationSenderParamsSchema>;
export type CreateOrganizationSenderResponse = IOrganizationSender;

export type DeleteOrganizationSenderParams = z.infer<typeof DeleteOrganizationSenderParamsSchema>;
export type DeleteOrganizationSenderResponse = number;
