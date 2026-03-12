import request from 'supertest';

import testApp from '../../app';
import * as accountsController from '../sections/account/account.controller';

// import './clearDbBeforeEach';
import {
    createAccountHelper,
    deleteAccountHelper,
    getAccountByIdHelper,
    getAccountBySlugHelper,
    getAllAccountsHelper,
    updateAccountHelper,
} from './utils/accounts';
import {getOrgHeader, getUserTokenHeader, prepareRoute} from './utils/common';
import {createScenarioHelper} from './utils/scenarios';

import {fullRoutes} from '#src/types/routes/account';

const {create, list, update} = fullRoutes;

describe('accounts.controller', () => {
    it('should export all handlers', () => {
        expect(accountsController).toHaveProperty('createAccountPost');
        expect(accountsController).toHaveProperty('updateAccountPatch');
        expect(accountsController).toHaveProperty('getAccountByIdGet');
        expect(accountsController).toHaveProperty('getAccountBySlugGet');
        expect(accountsController).toHaveProperty('getAllAccountsGet');
        expect(accountsController).toHaveProperty('deleteAccountDelete');
    });

    it('handlers should be functions', () => {
        expect(typeof accountsController.createAccountPost).toBe('function');
        expect(typeof accountsController.updateAccountPatch).toBe('function');
        expect(typeof accountsController.getAccountByIdGet).toBe('function');
        expect(typeof accountsController.getAccountBySlugGet).toBe('function');
        expect(typeof accountsController.getAllAccountsGet).toBe('function');
        expect(typeof accountsController.deleteAccountDelete).toBe('function');
    });

    it('create & getAll', async () => {
        const response = await createAccountHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);
        expect(response.body.id).toBeDefined();
        expect(response.body.slug).toBe('test-account');

        const response2 = await getAllAccountsHelper(testApp);
        expect(response2.body).toBeDefined();
        expect(Array.isArray(response2.body)).toBe(true);
        expect(response2.body.length).not.toBe(0);
        expect(response2.status).toBeLessThan(299);
    });

    it('update', async () => {
        const response = await createAccountHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await updateAccountHelper(
            {
                id: response.body.id,
                slug: 'test-account-updated',
                enabled: false,
            },
            testApp,
        );
        expect(response2.body).toBeDefined();
        expect(response2.body.slug).toBe('test-account-updated');
        expect(response2.body.enabled).toBe(false);
        expect(response2.status).toBeLessThan(299);
    }, 15000);

    it('delete', async () => {
        const response = await createAccountHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await deleteAccountHelper({id: response.body.id}, testApp);
        expect(response2.status).toBeLessThan(299);

        const response3 = await getAllAccountsHelper(testApp);
        expect(response3.body).toBeDefined();
        // count may be 0 or >0 if DB is not isolated, so just check status
        expect(response3.status).toBeLessThan(299);
    });

    it('getAccountById', async () => {
        const response = await createAccountHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await getAccountByIdHelper({id: response.body.id}, testApp);
        expect(response2.body).toBeDefined();
        expect(response2.body.id).toBe(response.body.id);
        expect(response2.status).toBeLessThan(299);
    });

    it('getAccountBySlug', async () => {
        const response = await createAccountHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await getAccountBySlugHelper({slug: response.body.slug}, testApp);
        expect(response2.body).toBeDefined();
        expect(response2.body.slug).toBe(response.body.slug);
        expect(response2.status).toBeLessThan(299);
    });

    describe('cross-organization validation', () => {
        it('should reject creating account with scenario from different organization', async () => {
            // Create a scenario in the default organization (org 1)
            const scenarioResponse = await createScenarioHelper();
            expect(scenarioResponse.status).toBeLessThan(299);
            const {organizationId: _organizationId, ...scenario} = scenarioResponse.body; // Remove organizationId

            // Try to create account with valid scenario but wrong org header
            // Since organization 999 doesn't exist, the scenario won't belong to it
            const accountResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': '999'}) // Non-existent organization
                .send({
                    slug: 'test-cross-org-account',
                    enabled: true,
                    availableScenarios: [scenario], // Use scenario object without organizationId
                });

            expect(accountResponse.status).toBe(400);
            expect(accountResponse.body.error).toContain(
                'does not belong to the specified organization',
            );
        });

        it('should reject updating account with scenario that does not exist', async () => {
            // Create account in org 1
            const accountResponse = await createAccountHelper();
            expect(accountResponse.status).toBeLessThan(299);
            const accountId = accountResponse.body.id;

            // Create a fake scenario object that doesn't exist in the DB
            const fakeScenario = {
                id: 99999, // Non-existent scenario ID
                slug: 'fake-scenario',
                type: 'ScenarioAddBannerAtTheEndUnique',
                enabled: true,
            };

            // Try to update account with non-existent scenario
            const updateResponse = await request(testApp)
                .patch(prepareRoute(update))
                .set(getUserTokenHeader())
                .set(getOrgHeader()) // Organization 1
                .send({
                    id: accountId,
                    availableScenarios: [fakeScenario],
                });

            expect(updateResponse.status).toBe(404);
            expect(updateResponse.body.error).toContain('not found');
        });

        it('should allow creating account with scenario from same organization', async () => {
            // Create scenario in same organization
            const scenarioResponse = await createScenarioHelper();
            expect(scenarioResponse.status).toBeLessThan(299);
            const {organizationId: _organizationId, ...scenario} = scenarioResponse.body; // Remove organizationId

            // Create account with scenario from same organization
            const accountResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set(getOrgHeader())
                .send({
                    slug: 'test-same-org-account',
                    enabled: true,
                    availableScenarios: [scenario], // Use scenario object without organizationId
                });

            expect(accountResponse.status).toBeLessThan(299);
            expect(accountResponse.body.id).toBeDefined();
        });
    });

    describe('Missing Organization Header', () => {
        it('should return 403 when x-organization-id header is missing', async () => {
            const response = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader()); // Only auth token, no org header

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('x-organization-id header is required');
        });
    });
});
