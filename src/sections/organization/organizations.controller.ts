import {wrapper} from '../../db/utils';
import {
    AddUserWithRoleToOrganizationParams,
    AddUserWithRoleToOrganizationParamsSchema,
    AddUserWithRoleToOrganizationResponse,
    CreateOrganizationParamsSchema,
    DeleteOrganizationParamsSchema,
    DeleteUserFromOrganizationParams,
    DeleteUserFromOrganizationParamsSchema,
    DeleteUserFromOrganizationResponse,
    GetAllOrganizationsParamsSchema,
    GetOrganizationByIdParamsSchema,
    GetOrganizationsByUserUidParamsSchema,
    UpdateOrganizationParamsSchema,
} from '../../types/schemas/handlers/organization';

import {
    addUserWithRoleToOrganization,
    createOrganization,
    deleteOrganization,
    deleteUserFromOrganization,
    getAllOrganizations,
    getOrganizationById,
    getOrganizationsByUserUid,
    updateOrganization,
} from '#src/db/organization';
import {
    CreateOrganizationParams,
    CreateOrganizationResponse,
    DeleteOrganizationParams,
    DeleteOrganizationResponse,
    GetAllOrganizationsParams,
    GetAllOrganizationsResponse,
    GetOrganizationByIdParams,
    GetOrganizationByIdResponse,
    GetOrganizationsByUserUidParams,
    GetOrganizationsByUserUidResponse,
    UpdateOrganizationParams,
    UpdateOrganizationResponse,
} from '#types';

export const createOrganizationPost = wrapper<CreateOrganizationParams, CreateOrganizationResponse>(
    createOrganization,
    CreateOrganizationParamsSchema,
    'POST',
);

export const getOrganizationsGet = wrapper<GetAllOrganizationsParams, GetAllOrganizationsResponse>(
    getAllOrganizations,
    GetAllOrganizationsParamsSchema,
    'GET',
);

export const getOrganizationByIdGet = wrapper<
    GetOrganizationByIdParams,
    GetOrganizationByIdResponse
>(getOrganizationById, GetOrganizationByIdParamsSchema, 'GET');

export const getOrganizationsByUserUidGet = wrapper<
    GetOrganizationsByUserUidParams,
    GetOrganizationsByUserUidResponse
>(getOrganizationsByUserUid, GetOrganizationsByUserUidParamsSchema, 'GET');

export const updateOrganizationPatch = wrapper<
    UpdateOrganizationParams,
    UpdateOrganizationResponse
>(updateOrganization, UpdateOrganizationParamsSchema, 'PATCH');

export const deleteOrganizationDelete = wrapper<
    DeleteOrganizationParams,
    DeleteOrganizationResponse
>(deleteOrganization, DeleteOrganizationParamsSchema, 'DELETE');

export const addUserWithRoleToOrganizationPost = wrapper<
    AddUserWithRoleToOrganizationParams,
    AddUserWithRoleToOrganizationResponse
>(addUserWithRoleToOrganization, AddUserWithRoleToOrganizationParamsSchema, 'POST');
export const deleteUserFromOrganizationDelete = wrapper<
    DeleteUserFromOrganizationParams,
    DeleteUserFromOrganizationResponse
>(deleteUserFromOrganization, DeleteUserFromOrganizationParamsSchema, 'DELETE');
