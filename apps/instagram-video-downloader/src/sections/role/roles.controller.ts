import {wrapper} from '../../db/utils';
import {
    CreateRoleParamsSchema,
    DeleteRoleParamsSchema,
    GetAllRolesParamsSchema,
    GetRoleByIdParamsSchema,
    UpdateRoleParamsSchema,
} from '../../types/schemas/handlers/role';

import {createRole, deleteRole, getAllRoles, getRoleById, updateRole} from '#src/db/role';
import {
    CreateRoleParams,
    CreateRoleResponse,
    DeleteRoleParams,
    DeleteRoleResponse,
    GetAllRolesParams,
    GetAllRolesResponse,
    GetRoleByIdParams,
    GetRoleByIdResponse,
    UpdateRoleParams,
    UpdateRoleResponse,
} from '#types';

export const createRolePost = wrapper<CreateRoleParams, CreateRoleResponse>(
    createRole,
    CreateRoleParamsSchema,
    'POST',
);

export const getRolesGet = wrapper<GetAllRolesParams, GetAllRolesResponse>(
    getAllRoles,
    GetAllRolesParamsSchema,
    'GET',
);

export const getRoleByIdGet = wrapper<GetRoleByIdParams, GetRoleByIdResponse>(
    getRoleById,
    GetRoleByIdParamsSchema,
    'GET',
);

export const updateRolePatch = wrapper<UpdateRoleParams, UpdateRoleResponse>(
    updateRole,
    UpdateRoleParamsSchema,
    'PATCH',
);

export const deleteRoleDelete = wrapper<DeleteRoleParams, DeleteRoleResponse>(
    deleteRole,
    DeleteRoleParamsSchema,
    'DELETE',
);
