import {Express} from 'express';
import request from 'supertest';

import app from '../../../app';
import {CreateInstagramMediaContainerParams} from '../../types';
import {fullRoutes} from '../../types/routes/instagramMediaContainer';

import {getOrgHeader, getUserTokenHeader, prepareRoute} from './common';

export async function createInstagramMediaContainerHelper(
    payload: CreateInstagramMediaContainerParams,
    testApp: Express = app,
) {
    return request(testApp)
        .post(prepareRoute(fullRoutes.create))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}

export async function getInstagramMediaContainersHelper(testApp: Express = app) {
    return request(testApp)
        .get(prepareRoute(fullRoutes.list))
        .set(getUserTokenHeader())
        .set(getOrgHeader());
}

export async function updateInstagramMediaContainerHelper(
    payload: Partial<CreateInstagramMediaContainerParams>,
    testApp: Express = app,
) {
    return request(testApp)
        .patch(prepareRoute(fullRoutes.update))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}
