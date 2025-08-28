import request from 'supertest';

import app from '../../../app';
import {DeleteScenarioParams, UpdateScenarioParams} from '../../types';
import {InstagramLocationSource, ScenarioType} from '../../types/enums';

import {getOrgHeader, getUserTokenHeader, prepareRoute} from './common';

import {fullRoutes} from '#src/types/routes/scenario';

function getUniqueSlug() {
    return `test-scenario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const defaultCreatePayload = {
    slug: getUniqueSlug(),
    type: ScenarioType.ScenarioAddBannerAtTheEndUnique,
    enabled: true,
    onlyOnce: false,
    options: {},
    instagramLocationSource: InstagramLocationSource.Scenario,
};

const {create, list, get, update, delete: deleteRoute} = fullRoutes;

export async function createScenarioHelper(payload = defaultCreatePayload, testApp = app) {
    const mergedPayload = {
        ...defaultCreatePayload,
        ...payload,
        slug: payload?.slug || getUniqueSlug(),
    };
    return request(testApp)
        .post(prepareRoute(create))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(mergedPayload);
}

export async function getAllScenariosHelper(testApp = app, query = {}) {
    return request(testApp)
        .get(prepareRoute(list))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(query);
}

export async function getScenarioByIdHelper(params = {}, testApp = app) {
    return request(testApp)
        .get(prepareRoute(get))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(params);
}

export async function updateScenarioHelper(payload: UpdateScenarioParams, testApp = app) {
    return request(testApp)
        .patch(prepareRoute(update))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}

export async function deleteScenarioHelper({id}: DeleteScenarioParams, testApp = app) {
    return request(testApp)
        .delete(prepareRoute(deleteRoute))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query({id});
}
