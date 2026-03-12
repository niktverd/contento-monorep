import {Express} from 'express';
import request from 'supertest';

import app from '../../../app';
import {
    CreateAccountParams,
    DeleteAccountParams,
    GetAccountByIdParams,
    GetAccountBySlugParams,
    GetAllAccountsParams,
    UpdateAccountParams,
} from '../../types';

import {getOrgHeader, getUserTokenHeader, prepareRoute} from './common';

import {fullRoutes} from '#src/types/routes/account';

const {create, list, get, update, delete: deleteRoute, getBySlug} = fullRoutes;

// Minimal valid payload for creating an account
const defaultCreatePayload: CreateAccountParams = {
    slug: 'test-account',
    enabled: true,
    // token is optional, userIdIG is optional
};

export async function createAccountHelper(
    payload: Partial<CreateAccountParams> = defaultCreatePayload,
    testApp: Express = app,
) {
    return request(testApp)
        .post(prepareRoute(create))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send({...defaultCreatePayload, ...payload});
}

export async function getAllAccountsHelper(
    testApp: Express = app,
    query: Partial<GetAllAccountsParams> = {},
) {
    return request(testApp)
        .get(prepareRoute(list))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(query);
}

export async function getAccountByIdHelper(params: GetAccountByIdParams, testApp: Express = app) {
    return request(testApp)
        .get(prepareRoute(get))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(params);
}

export async function getAccountBySlugHelper(
    params: GetAccountBySlugParams,
    testApp: Express = app,
) {
    return request(testApp)
        .get(prepareRoute(getBySlug))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(params);
}

export async function updateAccountHelper(payload: UpdateAccountParams, testApp: Express = app) {
    return request(testApp)
        .patch(prepareRoute(update))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .send(payload);
}

export async function deleteAccountHelper(params: DeleteAccountParams, testApp: Express = app) {
    return request(testApp)
        .delete(prepareRoute(deleteRoute))
        .set(getUserTokenHeader())
        .set(getOrgHeader())
        .query(params);
}
