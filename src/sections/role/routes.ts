import {Router as expressRouter} from 'express';

import {
    createRolePost,
    deleteRoleDelete,
    getRoleByIdGet,
    getRolesGet,
    updateRolePatch,
} from './roles.controller';

import {authMiddleware, checkPermissions, isSuperAdmin} from '#src/middleware';
import {routes} from '#src/types/routes/role';

const {create, list, get, update, delete: deleteRoute} = routes;

const router = expressRouter();

export enum RolePermissions {
    EditRole = 'roles.edit',
    GetRoles = 'roles.get',
}

// Admin routes - protected by systemAdminAuth middleware
router.post(
    create,
    [isSuperAdmin, authMiddleware, checkPermissions(RolePermissions.EditRole)],
    createRolePost,
);
router.get(
    list,
    [isSuperAdmin, authMiddleware, checkPermissions(RolePermissions.GetRoles)],
    getRolesGet,
);
router.get(
    get,
    [isSuperAdmin, authMiddleware, checkPermissions(RolePermissions.GetRoles)],
    getRoleByIdGet,
);
router.patch(
    update,
    [isSuperAdmin, authMiddleware, checkPermissions(RolePermissions.EditRole)],
    updateRolePatch,
);
router.delete(
    deleteRoute,
    [isSuperAdmin, authMiddleware, checkPermissions(RolePermissions.EditRole)],
    deleteRoleDelete,
);

export default router;
