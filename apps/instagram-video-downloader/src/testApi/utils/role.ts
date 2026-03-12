import {Express} from 'express';
import request from 'supertest';

import app from '../../../app';

import {getOrgHeader, getUserTokenHeader, prepareRoute} from './common';

import {fullRoutes} from '#src/types/routes/role';
import {CreateRoleParams} from '#types';

const defaultCreatePayload: CreateRoleParams = {
    name: 'test-role',
    description: 'test-description',
    permissions: [],
};

const {create} = fullRoutes;

export async function createRoleHelper(
    payload: Partial<CreateRoleParams> = defaultCreatePayload,
    testApp: Express = app,
) {
    return request(testApp)
        .post(prepareRoute(create))
        .send({...defaultCreatePayload, ...payload})
        .set(getUserTokenHeader())
        .set(getOrgHeader());
}
