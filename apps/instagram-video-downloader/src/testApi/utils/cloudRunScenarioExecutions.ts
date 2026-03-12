import request from 'supertest';

import testApp from '../../../app';

import {getOrgHeader, getUserTokenHeader, prepareRoute} from './common';

import {
    CloudRunScenarioExecutionParams,
    GetAllCloudRunScenarioExecutionParams,
    UpdateCloudRunScenarioExecutionParams,
} from '#schemas/handlers/cloudRunScenarioExecution';
import {fullRoutes} from '#src/types/routes/cloudRunScenarioExecution';

export function createCloudRunScenarioExecutionHelper(payload: CloudRunScenarioExecutionParams) {
    return request(testApp)
        .post(prepareRoute(fullRoutes.create))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}

export function getCloudRunScenarioExecutionHelper(payload: GetAllCloudRunScenarioExecutionParams) {
    return request(testApp)
        .get(prepareRoute(fullRoutes.list))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(payload);
}

export function updateCloudRunScenarioExecutionHelper(
    payload: UpdateCloudRunScenarioExecutionParams,
) {
    return request(testApp)
        .patch(prepareRoute(fullRoutes.update))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}
