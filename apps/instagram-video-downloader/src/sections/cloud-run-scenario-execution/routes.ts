import {Router as expressRouter} from 'express';

import {routes} from '../../types/routes/cloudRunScenarioExecution';

import {
    createCloudRunScenarioExecutionPost,
    getAllCloudRunScenarioExecutionGet,
    updateCloudRunScenarioExecutionStatusPatch,
} from './cloud-run-scenario-execution.controller';

import {authMiddleware, checkPermissions, requireOrganizationHeader} from '#src/middleware';

const {create, list, update} = routes;

export enum CloudRunScenarioExecutionsPermissions {
    Get = 'cloudRunScenarioExecutions.get',
    Edit = 'cloudRunScenarioExecutions.edit',
}

const router = expressRouter();

router.post(
    create,
    [
        authMiddleware,
        checkPermissions(CloudRunScenarioExecutionsPermissions.Edit),
        requireOrganizationHeader,
    ],
    createCloudRunScenarioExecutionPost,
);

router.get(
    list,
    [
        authMiddleware,
        checkPermissions(CloudRunScenarioExecutionsPermissions.Get),
        requireOrganizationHeader,
    ],
    getAllCloudRunScenarioExecutionGet,
);

router.patch(
    update,
    [
        authMiddleware,
        checkPermissions(CloudRunScenarioExecutionsPermissions.Edit),
        requireOrganizationHeader,
    ],
    updateCloudRunScenarioExecutionStatusPatch,
);

export default router;
