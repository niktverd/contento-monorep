import {Express} from 'express';
import request from 'supertest';

import {TEST_USER_TOKEN_HEADER, USER_TOKEN_HEADER} from '#src/constants';

export const prepareRoute = (
    route: string,
    withApiPrefix = true,
    query: Record<string, string> = {},
) => {
    let queryString = '';
    const queryEntries = Object.entries(query);
    for (const [key, value] of queryEntries) {
        queryString += `${key}=${value}&`;
    }

    if (queryString) {
        queryString = `?${queryString}`;
    }

    return withApiPrefix
        ? `${route}${queryString}`
        : `${route}${queryString}`.replace('/api/', '/');
};

export const getUserTokenHeader = () => ({
    [USER_TOKEN_HEADER]: Buffer.from(process.env.SUPER_ADMIN_SECRET || '', 'utf-8').toString(
        'base64',
    ),
    [TEST_USER_TOKEN_HEADER]: Buffer.from(process.env.SUPER_ADMIN_SECRET || '', 'utf-8').toString(
        'base64',
    ),
});

export const getOrgHeader = () => ({
    'x-organization-id': process.env.TEST_ORG_ID || '1',
});

export const createOrganizationHeader = (organizationId: number | string) => ({
    'x-organization-id': String(organizationId),
});

export const createDynamicOrgHeaders = async (testApp: Express, orgName?: string) => {
    const {fullRoutes} = await import('#src/types/routes/organization');
    const orgResponse = await request(testApp)
        .post(prepareRoute(fullRoutes.create))
        .set(getUserTokenHeader())
        .send({name: orgName || `Test Org ${Date.now()}`});

    if (orgResponse.status >= 400) {
        throw new Error(`Failed to create organization: ${orgResponse.status} ${orgResponse.text}`);
    }

    return {
        ...getUserTokenHeader(),
        'x-organization-id': String(orgResponse.body.id),
    };
};
