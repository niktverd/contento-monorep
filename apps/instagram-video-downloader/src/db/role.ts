import {Role} from './models/Role';

import {
    ApiFunctionPrototype,
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
} from '#src/types';
import {ThrownError} from '#src/utils/error';

export const createRole: ApiFunctionPrototype<CreateRoleParams, CreateRoleResponse> = async (
    params,
    db,
) => {
    const rolePromise = await db.transaction(async (trx) => {
        const role = await Role.query(trx).insert(params);

        return role;
    });

    return {
        result: rolePromise,
        code: 200,
    };
};

export const getRoleById: ApiFunctionPrototype<GetRoleByIdParams, GetRoleByIdResponse> = async (
    params,
    db,
) => {
    const role = await Role.query(db).findById(params.id);
    if (!role) {
        throw new ThrownError('Role not found', 404);
    }

    return {
        result: role,
        code: 200,
    };
};

export const getAllRoles: ApiFunctionPrototype<GetAllRolesParams, GetAllRolesResponse> = async (
    _params,
    db,
) => {
    const roles = await Role.query(db);

    return {
        result: roles,
        code: 200,
    };
};

export const updateRole: ApiFunctionPrototype<UpdateRoleParams, UpdateRoleResponse> = async (
    params,
    db,
) => {
    const {id, ...updateData} = params;

    const rolePromise = await db.transaction(async (t) => {
        const role = await Role.query(t).patchAndFetchById(id, updateData);

        if (!role) {
            throw new ThrownError('Role not found', 404);
        }

        return role;
    });

    return {
        result: rolePromise,
        code: 200,
    };
};

export const deleteRole: ApiFunctionPrototype<DeleteRoleParams, DeleteRoleResponse> = async (
    params,
    db,
) => {
    const hasRole = await Role.query(db).findById(params.id);
    if (!hasRole) {
        return {
            result: 0,
            code: 404,
        };
    }

    const deletedCount = await Role.query(db).deleteById(params.id);
    return {
        result: deletedCount,
        code: 204,
    };
};
