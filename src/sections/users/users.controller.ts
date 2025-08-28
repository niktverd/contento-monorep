import {wrapper} from '../../db/utils';
import {
    // CreateUserParamsSchema,
    // DeleteUserParamsSchema,
    GetAllUsersParamsSchema,
    // GetUserByIdParamsSchema,
    // UpdateUserParamsSchema,
} from '../../types/schemas/handlers/user';

import {
    //createUser,
    // deleteUser,
    getAllUsers,
    // getUserById,
    // updateUser,
} from '#src/db/user';
import {
    // CreateUserParams,
    // CreateUserResponse,
    // DeleteUserParams,
    // DeleteUserResponse,
    GetAllUsersParams,
    GetAllUsersResponse,
    // GetUserByIdParams,
    // GetUserByIdResponse,
    // UpdateUserParams,
    // UpdateUserResponse,
} from '#types';

// export const createUserPost = wrapper<CreateUserParams, CreateUserResponse>(
//     createUser,
//     CreateUserParamsSchema,
//     'POST',
// );

export const getAllUsersGet = wrapper<GetAllUsersParams, GetAllUsersResponse>(
    getAllUsers,
    GetAllUsersParamsSchema,
    'GET',
);

// export const getUserByIdGet = wrapper<GetUserByIdParams, GetUserByIdResponse>(
//     getUserById,
//     GetUserByIdParamsSchema,
//     'GET',
// );

// export const updateUserPatch = wrapper<UpdateUserParams, UpdateUserResponse>(
//     updateUser,
//     UpdateUserParamsSchema,
//     'PATCH',
// );

// export const deleteUserDelete = wrapper<DeleteUserParams, DeleteUserResponse>(
//     deleteUser,
//     DeleteUserParamsSchema,
//     'DELETE',
// );
