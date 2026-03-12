import {z} from 'zod';

import {IRole, RoleSchema} from './../models';

export const CreateRoleParamsSchema = RoleSchema.omit({id: true});

export const GetRoleByIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const UpdateRoleParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
    name: z.string().min(1, 'Role name is required'),
    description: z.string(),
    permissions: z.array(z.string()),
});

export const DeleteRoleParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const GetAllRolesParamsSchema = z.object({});

// types
export type CreateRoleParams = z.infer<typeof CreateRoleParamsSchema>;
export type CreateRoleResponse = IRole;

export type GetRoleByIdParams = z.infer<typeof GetRoleByIdParamsSchema>;
export type GetRoleByIdResponse = IRole;

export type GetAllRolesParams = Record<string, never>; // No params for getAll
export type GetAllRolesResponse = IRole[];

export type UpdateRoleParams = z.infer<typeof UpdateRoleParamsSchema>;
export type UpdateRoleResponse = IRole;

export type DeleteRoleParams = z.infer<typeof GetRoleByIdParamsSchema>;
export type DeleteRoleResponse = number;
