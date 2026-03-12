import {Express} from 'express';
import request from 'supertest';

import app from '../../../app';
import {
    CreatePreparedVideoParams,
    DeletePreparedVideoParams,
    GetAllPreparedVideosParams,
    GetPreparedVideoByIdParams,
    UpdatePreparedVideoParams,
} from '../../types';
import {fullRoutes} from '../../types/routes/preparedVideo';

import {getOrgHeader, getUserTokenHeader, prepareRoute} from './common';

// Minimal valid payload for creating a prepared video
export const buildPreparedVideoPayload = (ids: {
    scenarioId: number;
    sourceId: number;
    accountId: number;
}): CreatePreparedVideoParams => ({
    firebaseUrl: `https://dummy.firebase.com/video-${Date.now()}-${Math.random()}.mp4`,
    scenarioId: ids.scenarioId,
    sourceId: ids.sourceId,
    accountId: ids.accountId,
});

export async function createPreparedVideoHelper(
    payload: CreatePreparedVideoParams,
    testApp: Express = app,
) {
    return request(testApp)
        .post(prepareRoute(fullRoutes.create))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}

export async function getAllPreparedVideosHelper(
    testApp: Express = app,
    query: Partial<GetAllPreparedVideosParams> = {},
) {
    return request(testApp)
        .get(prepareRoute(fullRoutes.list))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(query);
}

export async function getPreparedVideoByIdHelper(
    params: GetPreparedVideoByIdParams,
    testApp: Express = app,
) {
    return request(testApp)
        .get(prepareRoute(fullRoutes.get))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(params);
}

export async function updatePreparedVideoHelper(
    payload: UpdatePreparedVideoParams,
    testApp: Express = app,
) {
    return request(testApp)
        .patch(prepareRoute(fullRoutes.update))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}

export async function deletePreparedVideoHelper(
    params: DeletePreparedVideoParams,
    testApp: Express = app,
) {
    return request(testApp)
        .delete(prepareRoute(fullRoutes.delete))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(params);
}

export async function findPreparedVideoDuplicatesHelper(
    params: {accountId: number; sourceId: number; scenarioId: number},
    testApp: Express = app,
) {
    return request(testApp)
        .get(prepareRoute(fullRoutes.duplicates))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(params);
}
