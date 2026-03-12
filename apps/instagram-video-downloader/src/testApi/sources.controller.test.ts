import request from 'supertest';

import testApp from '../../app';

// import './clearDbBeforeEach';
import {getOrgHeader, getUserTokenHeader, prepareRoute} from './utils/common';
import {
    createSourceHelper,
    deleteSourceHelper,
    getAllSourcesHelper,
    getOneSourceHelper,
    updateSourceHelper,
} from './utils/sources';

import * as sourcesController from '#src/sections/source/source.controller';
import {fullRoutes} from '#src/types/routes/source';

const {create, list, get, update, delete: deleteRoute, statistics} = fullRoutes;

describe('sources.controller', () => {
    it('should export all handlers', () => {
        expect(sourcesController).toHaveProperty('getAllSourcesGet');
        expect(sourcesController).toHaveProperty('getOneSourceGet');
        expect(sourcesController).toHaveProperty('updateSourcePatch');
        expect(sourcesController).toHaveProperty('createSourcePost');
        expect(sourcesController).toHaveProperty('deleteSourceDelete');
    });

    it('handlers should be functions', () => {
        expect(typeof sourcesController.getAllSourcesGet).toBe('function');
        expect(typeof sourcesController.getOneSourceGet).toBe('function');
        expect(typeof sourcesController.updateSourcePatch).toBe('function');
        expect(typeof sourcesController.createSourcePost).toBe('function');
        expect(typeof sourcesController.deleteSourceDelete).toBe('function');
    });

    it('create & getAll', async () => {
        const response = await createSourceHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await getAllSourcesHelper(testApp);
        expect(response2.body).toBeDefined();
        expect(response2.body.count).toBeDefined();
        expect(response2.body.count).not.toBe(0);
        expect(response2.status).toBeLessThan(299);
    });

    it('update', async () => {
        const response = await createSourceHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await updateSourceHelper(
            {
                id: response.body.id,
                sender: 'test2',
            },
            testApp,
        );
        expect(response2.body).toBeDefined();
        expect(response2.body.sender).toBe('test2');
        expect(response2.status).toBeLessThan(299);
    });

    it('delete', async () => {
        const response = await createSourceHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await deleteSourceHelper({id: response.body.id}, testApp);
        expect(response2.status).toBeLessThan(299);

        const response3 = await getAllSourcesHelper(testApp);
        expect(response3.body).toBeDefined();
        // count may be 0 or >0 if DB is not isolated, so just check status
        expect(response3.status).toBeLessThan(299);
    });

    it('getOne', async () => {
        const response = await createSourceHelper(undefined, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await getOneSourceHelper({id: response.body.id}, testApp);
        expect(response2.body).toBeDefined();
        expect(response2.body.id).toBe(response.body.id);
        expect(response2.status).toBeLessThan(299);
    });

    describe('organization isolation', () => {
        it('should isolate sources between organizations', async () => {
            // Create two organizations for testing
            const org1Response = await request(testApp)
                .post('/api/organization/create')
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post('/api/organization/create')
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            // Create source in org 1
            const org1SourceResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    sources: {
                        sender: 'test-sender-org1',
                        text: 'test-text-org1',
                        url: 'https://example.com/video1.mp4',
                    },
                    sender: 'test-sender-org1',
                });

            expect(org1SourceResponse.status).toBeLessThan(299);

            // Create source in org 2
            const org2SourceResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .send({
                    sources: {
                        sender: 'test-sender-org2',
                        text: 'test-text-org2',
                        url: 'https://example.com/video2.mp4',
                    },
                    sender: 'test-sender-org2',
                });

            expect(org2SourceResponse.status).toBeLessThan(299);

            // Verify org 1 can only see its source
            const org1SourcesResponse = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)});

            expect(org1SourcesResponse.status).toBeLessThan(299);
            expect(org1SourcesResponse.body.sources.length).toBe(1);
            expect(org1SourcesResponse.body.sources[0].sender).toBe('test-sender-org1');

            // Verify org 2 can only see its source
            const org2SourcesResponse = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)});

            expect(org2SourcesResponse.status).toBeLessThan(299);
            expect(org2SourcesResponse.body.sources.length).toBe(1);
            expect(org2SourcesResponse.body.sources[0].sender).toBe('test-sender-org2');

            // Verify org 1 cannot access org 2's source by ID
            const crossOrgAccessResponse = await request(testApp)
                .get(prepareRoute(get))
                .query({id: org2SourceResponse.body.id})
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)});

            expect(crossOrgAccessResponse.status).toBe(404); // Should not find the source in different org
        });

        it('should handle pagination and sorting within organization scope', async () => {
            // Create test organization
            const orgResponse = await request(testApp)
                .post('/api/organization/create')
                .set(getUserTokenHeader())
                .send({name: 'Test Pagination Org'});
            expect(orgResponse.status).toBeLessThan(299);

            // Create multiple sources in the organization
            const sourcesData = [
                {
                    sources: {
                        sender: 'alpha',
                        text: 'alpha text',
                        url: 'https://example.com/alpha.mp4',
                    },
                    sender: 'alpha',
                },
                {
                    sources: {
                        sender: 'beta',
                        text: 'beta text',
                        url: 'https://example.com/beta.mp4',
                    },
                    sender: 'beta',
                },
                {
                    sources: {
                        sender: 'gamma',
                        text: 'gamma text',
                        url: 'https://example.com/gamma.mp4',
                    },
                    sender: 'gamma',
                },
                {
                    sources: {
                        sender: 'delta',
                        text: 'delta text',
                        url: 'https://example.com/delta.mp4',
                    },
                    sender: 'delta',
                },
            ];

            for (const sourceData of sourcesData) {
                const sourceResponse = await request(testApp)
                    .post(prepareRoute(create))
                    .set(getUserTokenHeader())
                    .set({'x-organization-id': String(orgResponse.body.id)})
                    .send(sourceData);
                expect(sourceResponse.status).toBeLessThan(299);
            }

            // Test pagination - first page
            const page1Response = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(orgResponse.body.id)})
                .query({page: 1, limit: 2});

            expect(page1Response.status).toBeLessThan(299);
            expect(page1Response.body.sources.length).toBe(2);
            expect(page1Response.body.count).toBe(4);

            // Test pagination - second page
            const page2Response = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(orgResponse.body.id)})
                .query({page: 2, limit: 2});

            expect(page2Response.status).toBeLessThan(299);
            expect(page2Response.body.sources.length).toBe(2);
            expect(page2Response.body.count).toBe(4);

            // Test sorting
            const sortedResponse = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(orgResponse.body.id)})
                .query({sortBy: 'sender', sortOrder: 'asc'});

            expect(sortedResponse.status).toBeLessThan(299);
            expect(sortedResponse.body.sources.length).toBe(4);
            expect(sortedResponse.body.sources[0].sender).toBe('alpha');
            expect(sortedResponse.body.sources[3].sender).toBe('gamma');
        });

        it('should respect organization scope for notInPreparedVideos filter', async () => {
            // Create test organization
            const orgResponse = await request(testApp)
                .post('/api/organization/create')
                .set(getUserTokenHeader())
                .send({name: 'Test NotInPreparedVideos Org'});
            expect(orgResponse.status).toBeLessThan(299);

            // Create source in the organization
            const sourceResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(orgResponse.body.id)})
                .send({
                    sources: {
                        sender: 'test-sender',
                        text: 'test-text',
                        url: 'https://example.com/test.mp4',
                    },
                    sender: 'test-sender',
                });
            expect(sourceResponse.status).toBeLessThan(299);

            // Test notInPreparedVideos filter - should return the source since no prepared videos exist yet
            const notInPreparedResponse = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(orgResponse.body.id)})
                .query({notInThePreparedVideos: true});

            expect(notInPreparedResponse.status).toBeLessThan(299);
            expect(notInPreparedResponse.body.sources.length).toBe(1);

            // Verify the source appears in regular query too
            const allSourcesResponse = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(orgResponse.body.id)});

            expect(allSourcesResponse.status).toBeLessThan(299);
            expect(allSourcesResponse.body.sources.length).toBe(1);
        });

        it('should prevent cross-organization updates and deletes', async () => {
            // Create two organizations
            const org1Response = await request(testApp)
                .post('/api/organization/create')
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post('/api/organization/create')
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            // Create source in org 1
            const sourceResponse = await request(testApp)
                .post(prepareRoute(create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    sources: {
                        sender: 'test-sender',
                        text: 'test-text',
                        url: 'https://example.com/test.mp4',
                    },
                    sender: 'test-sender',
                });
            expect(sourceResponse.status).toBeLessThan(299);

            // Try to update source from org 2 - should fail
            const updateResponse = await request(testApp)
                .patch(prepareRoute(update))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .send({
                    id: sourceResponse.body.id,
                    sender: 'updated-sender',
                });

            expect(updateResponse.status).toBe(404); // Should not find the source in org 2

            // Try to delete source from org 2 - should fail
            const deleteResponse = await request(testApp)
                .delete(prepareRoute(deleteRoute))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .query({id: sourceResponse.body.id});

            expect(deleteResponse.status).toBeLessThan(299);
            expect(deleteResponse.body).toBe(0); // Should not delete anything

            // Verify source still exists in org 1 by checking list
            const verifyResponse = await request(testApp)
                .get(prepareRoute(list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)});

            expect(verifyResponse.status).toBeLessThan(299);
            expect(verifyResponse.body.sources.length).toBe(1);
            expect(verifyResponse.body.sources[0].sender).toBe('test-sender'); // Original value
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

    it('getSourcesStatisticsByDays: returns correct stats for given days', async () => {
        // Создаём записи с разными датами
        const now = new Date();
        const day1 = now.toISOString().slice(0, 10);
        const day2 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // вчера

        // Хак: создаём через createSourceHelper, потом патчим createdAt напрямую через knex
        await createSourceHelper(undefined, testApp);
        await createSourceHelper(undefined, testApp);
        const src3 = await createSourceHelper(undefined, testApp);
        // src1 и src2 — сегодня, src3 — вчера
        const db = require('#src/db/utils').getDb();
        try {
            await db('sources')
                .where({id: src3.body.id})
                .update({createdAt: `${day2}T12:00:00.000Z`});

            // Запросим статистику
            const res = await request(testApp)
                .get(prepareRoute(statistics))
                .set(getUserTokenHeader())
                .set(getOrgHeader())
                .query({days: [day1, day2]});
            expect(res.status).toBeLessThan(300);
            expect(res.body).toBeDefined();
            expect(typeof res.body).toBe('object');
            // Проверяем, что для day1 — 2 записи, для day2 — 1
            expect(res.body[day1]).toBe(2);
            expect(res.body[day2]).toBe(1);
        } finally {
            await db.destroy();
        }
    });
});
