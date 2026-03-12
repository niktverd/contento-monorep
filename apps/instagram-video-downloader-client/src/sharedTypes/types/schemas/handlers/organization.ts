import {z} from 'zod';

import {IOrganization, OrganizationSchema, UserSchema} from './../../../schemas/models';
import {zodOptionalNumber} from './utils';

export const CreateOrganizationParamsSchema = OrganizationSchema.omit({id: true});

export const GetOrganizationByIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const UpdateOrganizationParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
    name: z.string().min(1, 'Organization name is required'),
});

export const DeleteOrganizationParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const GetAllOrganizationsParamsSchema = z.object({});

export const GetOrganizationsByUserUidParamsSchema = z.object({
    uid: z.string(),
});

export const AddUserWithRoleToOrganizationParamsSchema = z
    .object({
        organizationId: z.number(),
        userId: z.number(),
        roleIds: z.array(z.number()),
    })
    .strict();

export const DeleteUserFromOrganizationParamsSchema = z
    .object({
        organizationId: z.number(),
        userId: z.number(),
    })
    .strict();

export const OrganizationRelationSchema = z.object({
    users: z.array(UserSchema),
});

export const GetSecretForInstagramLinkingParamsSchema = z.object({
    organizationId: zodOptionalNumber(),
});

export const GetSecretForInstagramLinkingResponseSchema = z.object({
    secret: z.string(),
});

// types
export type CreateOrganizationParams = z.infer<typeof CreateOrganizationParamsSchema>;
export type CreateOrganizationResponse = IOrganization;

export type GetOrganizationByIdParams = z.infer<typeof GetOrganizationByIdParamsSchema>;
export type GetOrganizationByIdResponse = IOrganization &
    z.infer<typeof OrganizationRelationSchema>;

export type GetAllOrganizationsParams = z.infer<typeof GetAllOrganizationsParamsSchema>;
export type GetAllOrganizationsResponse = IOrganization[];

export type GetOrganizationsByUserUidParams = z.infer<typeof GetOrganizationsByUserUidParamsSchema>;
export type GetOrganizationsByUserUidResponse = IOrganization[];

export type UpdateOrganizationParams = z.infer<typeof UpdateOrganizationParamsSchema>;
export type UpdateOrganizationResponse = IOrganization;

export type DeleteOrganizationParams = z.infer<typeof DeleteOrganizationParamsSchema>;
export type DeleteOrganizationResponse = number;

export type AddUserWithRoleToOrganizationParams = z.infer<
    typeof AddUserWithRoleToOrganizationParamsSchema
>;
export type AddUserWithRoleToOrganizationResponse = IOrganization;

export type DeleteUserFromOrganizationParams = z.infer<
    typeof DeleteUserFromOrganizationParamsSchema
>;
export type DeleteUserFromOrganizationResponse = IOrganization;

export type GetSecretForInstagramLinkingParams = z.infer<
    typeof GetSecretForInstagramLinkingParamsSchema
>;
export type GetSecretForInstagramLinkingResponse = z.infer<
    typeof GetSecretForInstagramLinkingResponseSchema
>;
