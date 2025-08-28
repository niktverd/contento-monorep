import {Router as expressRouter} from 'express';

import {
    addUserWithRoleToOrganizationPost,
    createOrganizationPost,
    deleteOrganizationDelete,
    deleteUserFromOrganizationDelete,
    getOrganizationByIdGet,
    getOrganizationsByUserUidGet,
    getOrganizationsGet,
    updateOrganizationPatch,
} from './organizations.controller';

import {authMiddleware, checkPermissions, isSuperAdmin} from '#src/middleware';
import {routes} from '#src/types/routes/organization';

const {
    create,
    list,
    get,
    update,
    delete: deleteRoute,
    addUserWithRolesToOrganization,
    deletUserFromOrganization,
    listByUid,
} = routes;

const router = expressRouter();

export enum OrganizationPermissions {
    EditOrganization = 'organizations.edit',
    GetOrganizations = 'organizations.get',
}

// Admin routes - protected by systemAdminAuth middleware
router.post(
    create,
    [isSuperAdmin, authMiddleware, checkPermissions(OrganizationPermissions.EditOrganization)],
    createOrganizationPost,
);
router.post(
    addUserWithRolesToOrganization,
    [isSuperAdmin, authMiddleware, checkPermissions(OrganizationPermissions.EditOrganization)],
    addUserWithRoleToOrganizationPost,
);
router.get(
    list,
    [isSuperAdmin, authMiddleware, checkPermissions(OrganizationPermissions.GetOrganizations)],
    getOrganizationsGet,
);
router.get(
    get,
    [isSuperAdmin, authMiddleware, checkPermissions(OrganizationPermissions.GetOrganizations)],
    getOrganizationByIdGet,
);
router.patch(
    update,
    [isSuperAdmin, authMiddleware, checkPermissions(OrganizationPermissions.EditOrganization)],
    updateOrganizationPatch,
);
router.delete(
    deleteRoute,
    [isSuperAdmin, authMiddleware, checkPermissions(OrganizationPermissions.EditOrganization)],
    deleteOrganizationDelete,
);
router.delete(
    deletUserFromOrganization,
    [isSuperAdmin, authMiddleware, checkPermissions(OrganizationPermissions.EditOrganization)],
    deleteUserFromOrganizationDelete,
);

router.get(listByUid, [authMiddleware], getOrganizationsByUserUidGet);

export default router;
