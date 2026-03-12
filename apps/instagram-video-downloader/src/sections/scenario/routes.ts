import {Router as expressRouter} from 'express';

import {
    createScenarioPost,
    deleteScenarioDelete,
    getAllScenariosGet,
    getScenarioByIdGet,
    updateScenarioPatch,
} from './scenario.controller';

import {authMiddleware, checkPermissions, requireOrganizationHeader} from '#src/middleware';
import {routes} from '#src/types/routes/scenario';

const {create, list, get, update, delete: deleteRoute} = routes;

const router = expressRouter();

export enum ScenariosPermissions {
    Get = 'scenarios.get',
    Edit = 'scenarios.edit',
}

// Organization-scoped routes - require organization header
router.post(
    create,
    [authMiddleware, requireOrganizationHeader, checkPermissions(ScenariosPermissions.Edit)],
    createScenarioPost,
);
router.get(
    list,
    [authMiddleware, requireOrganizationHeader, checkPermissions(ScenariosPermissions.Get)],
    getAllScenariosGet,
);
router.get(
    get,
    [authMiddleware, requireOrganizationHeader, checkPermissions(ScenariosPermissions.Get)],
    getScenarioByIdGet,
);
router.patch(
    update,
    [authMiddleware, requireOrganizationHeader, checkPermissions(ScenariosPermissions.Edit)],
    updateScenarioPatch,
);
router.delete(
    deleteRoute,
    [authMiddleware, requireOrganizationHeader, checkPermissions(ScenariosPermissions.Edit)],
    deleteScenarioDelete,
);

export default router;
