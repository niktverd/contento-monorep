import request from 'supertest';

import app from '../../../app';
import {DeleteSourceParams, UpdateSourceParams} from '../../types';

import {getOrgHeader, getUserTokenHeader, prepareRoute} from './common';

import {fullRoutes} from '#src/types/routes/source';

// Default payload for creating a source (customize as needed)
const defaultCreatePayload = {
    sources: {foo: 'bar'},
};

const {create, list, get, update, delete: deleteRoute} = fullRoutes;

export async function createSourceHelper(payload = defaultCreatePayload, testApp = app) {
    return request(testApp)
        .post(prepareRoute(create))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}

export async function getAllSourcesHelper(testApp = app, query = {}) {
    return request(testApp)
        .get(prepareRoute(list))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(query);
}

export async function getOneSourceHelper(params = {}, testApp = app) {
    return request(testApp)
        .get(prepareRoute(get))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(params);
}

export async function updateSourceHelper(payload: UpdateSourceParams, testApp = app) {
    return request(testApp)
        .patch(prepareRoute(update))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}

export async function deleteSourceHelper({id}: DeleteSourceParams, testApp = app) {
    return request(testApp)
        .delete(prepareRoute(deleteRoute))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query({id});
}
