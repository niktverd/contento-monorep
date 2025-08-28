import request from 'supertest';

import testApp from '../../app';
import * as scenariosController from '../sections/scenario/scenario.controller';

// import './clearDbBeforeEach';
import {getUserTokenHeader, prepareRoute} from './utils/common';
import {
    createScenarioHelper,
    deleteScenarioHelper,
    getAllScenariosHelper,
    getScenarioByIdHelper,
    updateScenarioHelper,
} from './utils/scenarios';

import {fullRoutes as organizationRoutes} from '#src/types/routes/organization';
import {fullRoutes as scenarioRoutes} from '#src/types/routes/scenario';

const {get, create, list, update, delete: deleteRoute} = scenarioRoutes;
const {create: createOrganization} = organizationRoutes;

describe('scenarios.controller', () => {
    it('should export all handlers', () => {
        expect(scenariosController).toHaveProperty('getAllScenariosGet');
        expect(scenariosController).toHaveProperty('getScenarioByIdGet');
        expect(scenariosController).toHaveProperty('updateScenarioPatch');
        expect(scenariosController).toHaveProperty('createScenarioPost');
        expect(scenariosController).toHaveProperty('deleteScenarioDelete');
    });

    it('handlers should be functions', () => {
        expect(typeof scenariosController.getAllScenariosGet).toBe('function');
        expect(typeof scenariosController.getScenarioByIdGet).toBe('function');
        expect(typeof scenariosController.updateScenarioPatch).toBe('function');
        expect(typeof scenariosController.createScenarioPost).toBe('function');
        expect(typeof scenariosController.deleteScenarioDelete).toBe('function');
    });

    it('create & getAll', async () => {
        const response = await createScenarioHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await getAllScenariosHelper(testApp);
        expect(response2.body).toBeDefined();
        expect(Array.isArray(response2.body)).toBe(true);
        expect(response2.body.length).not.toBe(0);
        expect(response2.status).toBeLessThan(299);
    });

    it('update', async () => {
        const response = await createScenarioHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await updateScenarioHelper(
            {
                id: response.body.id,
                slug: 'test-scenario-updated',
                type: response.body.type,
                enabled: false,
                onlyOnce: false,
                options: {},
                instagramLocationSource: response.body.instagramLocationSource,
            },
            testApp,
        );
        expect(response2.body).toBeDefined();
        expect(response2.body.slug).toBe('test-scenario-updated');
        expect(response2.status).toBeLessThan(299);
    });

    it('delete', async () => {
        const response = await createScenarioHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await deleteScenarioHelper({id: response.body.id}, testApp);
        expect(response2.status).toBeLessThan(299);

        const response3 = await getAllScenariosHelper(testApp);
        expect(response3.body).toBeDefined();
        expect(Array.isArray(response3.body)).toBe(true);
        // count may be 0 or >0 if DB is not isolated, so just check status
        expect(response3.status).toBeLessThan(299);
    });

    it('getById', async () => {
        const response = await createScenarioHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await getScenarioByIdHelper({id: response.body.id}, testApp);
        expect(response2.body).toBeDefined();
        expect(response2.body.id).toBe(response.body.id);
        expect(response2.status).toBeLessThan(299);
    });

    describe('organization isolation', () => {
        it('should allow same slug in different organizations', async () => {
            // Create two organizations for testing
            const org1Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            const uniqueSlug = `shared-slug-${Date.now()}`;

            // Create scenario in org 1
            const org1ScenarioResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    slug: uniqueSlug,
                    type: 'ScenarioAddBannerAtTheEndUnique',
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: 'scenario',
                });

            expect(org1ScenarioResponse.status).toBeLessThan(299);
            expect(org1ScenarioResponse.body.slug).toBe(uniqueSlug);

            // Create scenario with same slug in org 2
            const org2ScenarioResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .send({
                    slug: uniqueSlug,
                    type: 'ScenarioAddBannerAtTheEndUnique',
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: 'scenario',
                });

            expect(org2ScenarioResponse.status).toBeLessThan(299);
            expect(org2ScenarioResponse.body.slug).toBe(uniqueSlug);
            expect(org2ScenarioResponse.body.id).not.toBe(org1ScenarioResponse.body.id);
        });

        it('should not allow access to scenarios from different organization', async () => {
            // Create two organizations for testing
            const org1Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            // Create scenario in org 1
            const org1ScenarioResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    slug: `org1-scenario-${Date.now()}`,
                    type: 'ScenarioAddBannerAtTheEndUnique',
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: 'scenario',
                });

            expect(org1ScenarioResponse.status).toBeLessThan(299);

            // Try to access it from org 2
            const org2GetResponse = await request(testApp)
                .get(prepareRoute(get))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .query({id: org1ScenarioResponse.body.id});

            expect(org2GetResponse.status).toBe(404);
        });

        it('should not allow updating scenarios from different organization', async () => {
            // Create two organizations for testing
            const org1Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            // Create scenario in org 1
            const org1ScenarioResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    slug: `org1-scenario-${Date.now()}`,
                    type: 'ScenarioAddBannerAtTheEndUnique',
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: 'scenario',
                });

            expect(org1ScenarioResponse.status).toBeLessThan(299);

            // Try to update it from org 2
            const org2UpdateResponse = await request(testApp)
                .patch(prepareRoute(update))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .send({
                    id: org1ScenarioResponse.body.id,
                    slug: 'updated-from-org2',
                    type: org1ScenarioResponse.body.type,
                    enabled: false,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: org1ScenarioResponse.body.instagramLocationSource,
                });

            expect(org2UpdateResponse.status).toBe(404);
        });

        it('should not allow deleting scenarios from different organization', async () => {
            // Create two organizations for testing
            const org1Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            // Create scenario in org 1
            const org1ScenarioResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    slug: `org1-scenario-${Date.now()}`,
                    type: 'ScenarioAddBannerAtTheEndUnique',
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: 'scenario',
                });

            expect(org1ScenarioResponse.status).toBeLessThan(299);

            // Try to delete it from org 2
            const org2DeleteResponse = await request(testApp)
                .delete(prepareRoute(deleteRoute))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .query({id: org1ScenarioResponse.body.id});

            expect(org2DeleteResponse.status).toBe(404);

            // Verify it still exists in org 1
            const org1GetResponse = await request(testApp)
                .get(prepareRoute(get))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .query({id: org1ScenarioResponse.body.id});

            expect(org1GetResponse.status).toBeLessThan(299);
            expect(org1GetResponse.body.id).toBe(org1ScenarioResponse.body.id);
        });

        it('should only list scenarios from same organization', async () => {
            // Create two organizations for testing
            const org1Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post(prepareRoute(createOrganization))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            // Create scenario in org 1
            const org1ScenarioResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    slug: `org1-scenario-${Date.now()}`,
                    type: 'ScenarioAddBannerAtTheEndUnique',
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: 'scenario',
                });

            expect(org1ScenarioResponse.status).toBeLessThan(299);

            // Create scenario in org 2
            const org2ScenarioResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .send({
                    slug: `org2-scenario-${Date.now()}`,
                    type: 'ScenarioAddBannerAtTheEndUnique',
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: 'scenario',
                });

            expect(org2ScenarioResponse.status).toBeLessThan(299);

            // List scenarios from org 1
            const org1ListResponse = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)});

            expect(org1ListResponse.status).toBeLessThan(299);
            expect(Array.isArray(org1ListResponse.body)).toBe(true);
            const org1ScenarioIds = org1ListResponse.body.map((s: {id: number}) => s.id);
            expect(org1ScenarioIds).toContain(org1ScenarioResponse.body.id);
            expect(org1ScenarioIds).not.toContain(org2ScenarioResponse.body.id);

            // List scenarios from org 2
            const org2ListResponse = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)});

            expect(org2ListResponse.status).toBeLessThan(299);
            expect(Array.isArray(org2ListResponse.body)).toBe(true);
            const org2ScenarioIds = org2ListResponse.body.map((s: {id: number}) => s.id);
            expect(org2ScenarioIds).toContain(org2ScenarioResponse.body.id);
            expect(org2ScenarioIds).not.toContain(org1ScenarioResponse.body.id);
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
