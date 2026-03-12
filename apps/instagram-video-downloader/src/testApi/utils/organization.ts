import {Express} from 'express';
import request from 'supertest';

import app from '../../../app';

import {getOrgHeader, getUserTokenHeader, prepareRoute} from './common';

import {fullRoutes} from '#src/types/routes/organization';
import {CreateOrganizationParams} from '#types';

const defaultCreatePayload: CreateOrganizationParams = {
    name: 'test-organization',
};

const {create} = fullRoutes;

export async function createOrganizationHelper(
    payload: Partial<CreateOrganizationParams> = defaultCreatePayload,
    testApp: Express = app,
) {
    return request(testApp)
        .post(prepareRoute(create))
        .send({...defaultCreatePayload, ...payload})
        .set(getUserTokenHeader())
        .set(getOrgHeader());
}
