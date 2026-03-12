import {Router as expressRouter} from 'express';

import {
    // createUserPost,
    // deleteUserDelete,
    // getUserByIdGet,
    getAllUsersGet,
    // updateUserPatch,
} from './users.controller';

import {authMiddleware, checkPermissions, isSuperAdmin} from '#src/middleware';
import {routes} from '#src/types/routes/user';

const {
    //create,
    list,
    // get,
    // update,
    // delete: deleteRoute,
} = routes;

const router = expressRouter();

export enum UserPermissions {
    EditUser = 'users.edit',
    GetUsers = 'users.get',
}

// Admin routes - protected by systemAdminAuth middleware
// router.post(
//     create,
//     [isSuperAdmin, authMiddleware, checkPermissions(UserPermissions.EditUser)],
//     createUserPost,
// );
router.get(
    list,
    [isSuperAdmin, authMiddleware, checkPermissions(UserPermissions.GetUsers)],
    getAllUsersGet,
);
// router.get(
//     get,
//     [isSuperAdmin, authMiddleware, checkPermissions(UserPermissions.GetUsers)],
//     getUserByIdGet,
// );
// router.patch(
//     update,
//     [isSuperAdmin, authMiddleware, checkPermissions(UserPermissions.EditUser)],
//     updateUserPatch,
// );
// router.delete(
//     deleteRoute,
//     [isSuperAdmin, authMiddleware, checkPermissions(UserPermissions.EditUser)],
//     deleteUserDelete,
// );

export default router;
