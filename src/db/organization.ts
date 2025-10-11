import {uniqBy} from 'lodash';

import {Organization} from './models/Organization';
import User from './models/User';

import UserOrganizationRole from '#models/UserOrganizationRole';
import {
    AddUserWithRoleToOrganizationParams,
    AddUserWithRoleToOrganizationResponse,
    ApiFunctionPrototype,
    CreateOrganizationParams,
    CreateOrganizationResponse,
    DeleteOrganizationParams,
    DeleteOrganizationResponse,
    DeleteUserFromOrganizationParams,
    DeleteUserFromOrganizationResponse,
    GetAllOrganizationsParams,
    GetAllOrganizationsResponse,
    GetOrganizationByIdParams,
    GetOrganizationByIdResponse,
    GetOrganizationsByUserUidParams,
    GetOrganizationsByUserUidResponse,
    GetSecretForInstagramLinkingParams,
    GetSecretForInstagramLinkingResponse,
    UpdateOrganizationParams,
    UpdateOrganizationResponse,
} from '#src/types';
import {ThrownError} from '#src/utils/error';

export const createOrganization: ApiFunctionPrototype<
    CreateOrganizationParams,
    CreateOrganizationResponse
> = async (params, db) => {
    const {name} = params;

    const organizationPromise = await db.transaction(async (trx) => {
        const organization = await Organization.query(trx).insert({name});

        return organization;
    });

    return {
        result: organizationPromise,
        code: 200,
    };
};

export const getOrganizationById: ApiFunctionPrototype<
    GetOrganizationByIdParams,
    GetOrganizationByIdResponse
> = async (params, db) => {
    const organization = await Organization.query(db)
        .findById(params.id)
        .withGraphFetched('users.[roles]');

    if (!organization) {
        throw new ThrownError('Organization not found', 404);
    }

    organization.users = uniqBy(organization.users, 'id');

    return {
        result: organization,
        code: 200,
    };
};

export const getAllOrganizations: ApiFunctionPrototype<
    GetAllOrganizationsParams,
    GetAllOrganizationsResponse
> = async (_params, db) => {
    const organizations = await Organization.query(db).withGraphFetched('users.[roles]');

    return {
        result: organizations,
        code: 200,
    };
};

export const updateOrganization: ApiFunctionPrototype<
    UpdateOrganizationParams,
    UpdateOrganizationResponse
> = async (params, db) => {
    const {id, ...updateData} = params;

    const organizationPromise = await db.transaction(async (t) => {
        const organization = await Organization.query(t).patchAndFetchById(id, updateData);

        if (!organization) {
            throw new ThrownError('Organization not found', 404);
        }

        return organization;
    });

    return {
        result: organizationPromise,
        code: 200,
    };
};

export const deleteOrganization: ApiFunctionPrototype<
    DeleteOrganizationParams,
    DeleteOrganizationResponse
> = async (params, db) => {
    const hasOrganization = await Organization.query(db).findById(params.id);
    if (!hasOrganization) {
        return {
            result: 0,
            code: 404,
        };
    }

    const deletedCount = await Organization.query(db).deleteById(params.id);

    return {
        result: deletedCount,
        code: 204,
    };
};

export const addUserWithRoleToOrganization: ApiFunctionPrototype<
    AddUserWithRoleToOrganizationParams,
    AddUserWithRoleToOrganizationResponse
> = async (params, db) => {
    const {roleIds = [], ...rest} = params;

    for (const roleId of roleIds) {
        await UserOrganizationRole.query(db).insert({...rest, roleId});
    }

    const {result: organization} = await getOrganizationById({id: rest.organizationId}, db);

    return {
        result: organization,
        status: 200,
    };
};

export const deleteUserFromOrganization: ApiFunctionPrototype<
    DeleteUserFromOrganizationParams,
    DeleteUserFromOrganizationResponse
> = async (params, db) => {
    await UserOrganizationRole.query(db)
        .where({organizationId: params.organizationId, userId: params.userId})
        .delete();

    const {result: organization} = await getOrganizationById({id: params.organizationId}, db);

    return {
        result: organization,
        status: 200,
    };
};

export const getOrganizationsByUserUid: ApiFunctionPrototype<
    GetOrganizationsByUserUidParams,
    GetOrganizationsByUserUidResponse
> = async (params, db) => {
    // First verify that a user with the given uid exists and get their organizations
    const user = await User.query(db)
        .where('uid', params.uid)
        .withGraphFetched('organizations')
        .first();

    if (!user) {
        throw new ThrownError('User not found', 404);
    }

    // Return the user's organizations (already deduplicated by the relationship)
    return {
        result: uniqBy(user.organizations, 'id'),
        code: 200,
    };
};

export const getSecretForInstagramLinking: ApiFunctionPrototype<
    GetSecretForInstagramLinkingParams,
    GetSecretForInstagramLinkingResponse
> = async (params, _db, options = {}) => {
    const organizationId = options.organizationId || params.organizationId;

    if (!organizationId) {
        throw new ThrownError('getSecretForInstagramLinking | Organization ID is required', 400);
    }

    const object = {
        organizationId,
        secret: 'instagram-secret',
        date: new Date().toISOString(),
    };

    const secret = Buffer.from(JSON.stringify(object)).toString('base64');

    return {
        result: {secret},
        code: 200,
    };
};
