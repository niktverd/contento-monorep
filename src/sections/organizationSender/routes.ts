import {Router as expressRouter} from 'express';

import {OrganizationPermissions} from '../organization/routes';

import {
    deleteOrganizationSenderDelete,
    getOrganizationSendersByOrganizationIdGet,
} from './organizationSender.controller';

import {authMiddleware, checkPermissions, isSuperAdmin} from '#src/middleware';
import {routes} from '#src/types/routes/organizationSender';

const {list, delete: deleteRoute} = routes;

const router = expressRouter();

// Admin routes - protected by systemAdminAuth middleware
router.get(
    list,
    [isSuperAdmin, authMiddleware, checkPermissions(OrganizationPermissions.GetOrganizations)],
    getOrganizationSendersByOrganizationIdGet,
);

router.delete(
    deleteRoute,
    [isSuperAdmin, authMiddleware, checkPermissions(OrganizationPermissions.EditOrganization)],
    deleteOrganizationSenderDelete,
);

export default router;
