import {Router as expressRouter} from 'express';

import {
    createSourcePost,
    deleteSourceDelete,
    getAllSourcesGet,
    getOneSourceGet,
    getSourcesStatisticsByDaysGet,
    updateSourcePatch,
} from './source.controller';

import {authMiddleware, checkPermissions, requireOrganizationHeader} from '#src/middleware';
import {routes} from '#src/types/routes/source';

const {create, list, get, update, delete: deleteRoute, statistics} = routes;

const router = expressRouter();

export enum SourcesPermissions {
    Get = 'sources.get',
    Edit = 'sources.edit',
}

// Organization-scoped routes - require organization header
router.post(
    create,
    [authMiddleware, requireOrganizationHeader, checkPermissions(SourcesPermissions.Edit)],
    createSourcePost,
);
router.get(
    list,
    [authMiddleware, requireOrganizationHeader, checkPermissions(SourcesPermissions.Get)],
    getAllSourcesGet,
);
router.get(
    get,
    [authMiddleware, requireOrganizationHeader, checkPermissions(SourcesPermissions.Get)],
    getOneSourceGet,
);
router.patch(
    update,
    [authMiddleware, requireOrganizationHeader, checkPermissions(SourcesPermissions.Edit)],
    updateSourcePatch,
);
router.delete(
    deleteRoute,
    [authMiddleware, requireOrganizationHeader, checkPermissions(SourcesPermissions.Edit)],
    deleteSourceDelete,
);
router.get(
    statistics,
    [authMiddleware, requireOrganizationHeader, checkPermissions(SourcesPermissions.Get)],
    getSourcesStatisticsByDaysGet,
);

export default router;
