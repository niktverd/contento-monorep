/* eslint-disable @typescript-eslint/no-explicit-any */
import {User} from '#src/db/models';
import {
    ApiFunctionPrototype,
    CreateUserParams,
    CreateUserParamsSchema,
    CreateUserResponse,
    DeleteUserParams,
    DeleteUserResponse,
    GetAllUsersParams,
    GetAllUsersResponse,
    GetOrCreateUserParams,
    GetOrCreateUserResponse,
    GetUserByEmailParams,
    GetUserByEmailResponse,
    GetUserByIdParams,
    GetUserByIdResponse,
    GetUserByUidParams,
    GetUserByUidResponse,
    IOrganization,
    IRole,
    IUser,
    UpdateUserParams,
    UpdateUserParamsSchema,
    UpdateUserResponse,
} from '#src/types';
import {ThrownError} from '#src/utils/error';

export const createUser: ApiFunctionPrototype<CreateUserParams, CreateUserResponse> = async (
    params,
    db,
) => {
    const paramsValidated = CreateUserParamsSchema.parse(params);

    const userData: Omit<IUser, 'id' | 'roles' | 'organizations'> = {
        email: paramsValidated.email,
        name: paramsValidated.name,
        uid: paramsValidated.uid,
    };

    const user = await User.query(db).insert(userData);
    return {
        result: {...user, roles: [] as IRole[], organizations: [] as IOrganization[]},
        code: 200,
    };
};

export const getUserById: ApiFunctionPrototype<GetUserByIdParams, GetUserByIdResponse> = async (
    params,
    db,
) => {
    const user = await User.query(db).findById(params.id);
    if (!user) {
        throw new ThrownError('User not found', 404);
    }

    return {
        result: user,
        code: 200,
    };
};
export const getUserByUid: ApiFunctionPrototype<GetUserByUidParams, GetUserByUidResponse> = async (
    params,
    db,
) => {
    const {uid, organizationId} = params;

    const userQuery = User.query(db).findOne({uid: uid});

    if (organizationId) {
        userQuery
            .withGraphFetched('[organizations, roles]')
            .modifyGraph('organizations', (builder) => {
                builder.where('organizations.id', organizationId);
            })
            .modifyGraph('roles', (builder) => {
                builder.where('userOrganizationRoles.organizationId', organizationId);
            });
    }

    const user = await userQuery;

    if (!user) {
        throw new ThrownError('User not found', 404);
    }

    if (!user.roles) {
        user.roles = [];
    }

    if (!user.organizations) {
        user.organizations = [];
    }

    return {
        result: user,
        code: 200,
    };
};

export const getUserByEmail: ApiFunctionPrototype<
    GetUserByEmailParams,
    GetUserByEmailResponse
> = async (params, db) => {
    const user = await User.query(db).where('email', params.email).first();

    if (!user) {
        throw new ThrownError('User not found', 404);
    }

    return {
        result: user,
        code: 200,
    };
};

export const getAllUsers: ApiFunctionPrototype<GetAllUsersParams, GetAllUsersResponse> = async (
    _params,
    db,
) => {
    const users = await User.query(db);

    return {
        result: users,
        code: 200,
    };
};

export const updateUser: ApiFunctionPrototype<UpdateUserParams, UpdateUserResponse> = async (
    params,
    db,
) => {
    const {id, ...updateData} = UpdateUserParamsSchema.parse(params);

    const user = await User.query(db).patchAndFetchById(id, updateData);
    return {
        result: user,
        code: 200,
    };
};

export const deleteUser: ApiFunctionPrototype<DeleteUserParams, DeleteUserResponse> = async (
    params,
    db,
) => {
    const deletedCount = await User.query(db).deleteById(params.id);
    return {
        result: deletedCount,
        code: 200,
    };
};

export const getOrCreateUser: ApiFunctionPrototype<
    GetOrCreateUserParams,
    GetOrCreateUserResponse
> = async (params, db) => {
    const {organizationId, ...userData} = params;
    if (!params.uid) {
        throw new ThrownError('UID is not provider', 404);
    }

    try {
        return await getUserByUid({uid: params.uid, organizationId}, db);
    } catch {}

    return await createUser(userData, db);
};
