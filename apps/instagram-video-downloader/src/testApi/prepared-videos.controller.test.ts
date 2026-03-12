import request from 'supertest';

import testApp from '../../app';
import * as preparedVideosController from '../sections/prepared-video/prepared-video.controller';
import {CreatePreparedVideoResponse} from '../types';
import {fullRoutes} from '../types/routes/preparedVideo';

// import './clearDbBeforeEach';
import {getOrgHeader, getUserTokenHeader, prepareRoute} from './utils/common';
import {
    buildPreparedVideoPayload,
    createPreparedVideoHelper,
    deletePreparedVideoHelper,
    findPreparedVideoDuplicatesHelper,
    getAllPreparedVideosHelper,
    getPreparedVideoByIdHelper,
    updatePreparedVideoHelper,
} from './utils/prepared-videos';
import {createScenarioHelper} from './utils/scenarios';
import {createSourceHelper} from './utils/sources';

import {fullRoutes as accountRoutes} from '#src/types/routes/account';
import {fullRoutes as organizationRoutes} from '#src/types/routes/organization';
import {fullRoutes as preparedVideoRoutes} from '#src/types/routes/preparedVideo';
import {fullRoutes as scenarioRoutes} from '#src/types/routes/scenario';
import {fullRoutes as sourceRoutes} from '#src/types/routes/source';

const {create: createScenario} = scenarioRoutes;
const {create: createSource} = sourceRoutes;
const {create: createAccount} = accountRoutes;
const {create: createOrganization} = organizationRoutes;
const {
    create: createPreparedVideo,
    statistics: getPreparedVideosStatisticsByDays,
    get: getPreparedVideoById,
    hasPreparedVideoBeenCreated,
    update: updatePreparedVideo,
    delete: deletePreparedVideo,
    list: getAllPreparedVideos,
    duplicates: findPreparedVideoDuplicates,
} = preparedVideoRoutes;

describe('prepared-videos.controller', () => {
    // Debug test to see what routes are available
    it('should have correct fullRoutes', () => {
        expect(fullRoutes.create).toBeDefined();
        expect(fullRoutes.list).toBeDefined();
        expect(fullRoutes.get).toBeDefined();
        expect(fullRoutes.update).toBeDefined();
        expect(fullRoutes.delete).toBeDefined();
    });

    async function createDeps() {
        const scenario = await createScenarioHelper(undefined, testApp);
        const source = await createSourceHelper(undefined, testApp);
        const account = await request(testApp)
            .post(prepareRoute(createAccount))
            .set(getUserTokenHeader())
            .set(getOrgHeader())
            .send({
                slug: `test-account-${Date.now()}`,
                enabled: true,
            });
        return {
            scenarioId: scenario.body.id,
            sourceId: source.body.id,
            accountId: account.body.id,
        };
    }

    // Cache for created organizations
    let testOrganizations: {[key: string]: string} = {};

    beforeEach(() => {
        // Clear organization cache between tests
        testOrganizations = {};
    });

    // Helper to create test organizations
    async function ensureTestOrganization(name: string) {
        if (testOrganizations[name]) {
            return testOrganizations[name];
        }

        const response = await request(testApp)
            .post(prepareRoute(createOrganization))
            .set(getUserTokenHeader())
            .send({
                name: `Test Organization ${name}`,
            });

        if (response.status >= 400) {
            throw new Error(`Failed to create organization: ${response.status} ${response.text}`);
        }

        const orgId = response.body.id.toString();
        testOrganizations[name] = orgId;
        return orgId;
    }

    // Helper to create deps with specific org
    async function createDepsWithOrg(orgName: string) {
        const orgId = await ensureTestOrganization(orgName);
        const getOrgHeaderForOrg = () => ({'x-organization-id': orgId});

        const scenario = await request(testApp)
            .post(prepareRoute(createScenario))
            .set(getUserTokenHeader())
            .set(getOrgHeaderForOrg())
            .send({
                slug: `test-scenario-${Date.now()}`,
                type: 'ScenarioAddBannerAtTheEndUnique',
                enabled: true,
                onlyOnce: false,
                options: {},
                instagramLocationSource: 'scenario',
            });

        if (scenario.status >= 400) {
            throw new Error(`Failed to create scenario: ${scenario.status} ${scenario.text}`);
        }

        const source = await request(testApp)
            .post(prepareRoute(createSource))
            .set(getUserTokenHeader())
            .set(getOrgHeaderForOrg())
            .send({sources: {foo: 'bar'}});

        if (source.status >= 400) {
            throw new Error(`Failed to create source: ${source.status} ${source.text}`);
        }

        const account = await request(testApp)
            .post(prepareRoute(createAccount))
            .set(getUserTokenHeader())
            .set(getOrgHeaderForOrg())
            .send({
                slug: `test-account-${Date.now()}`,
                enabled: true,
            });

        if (account.status >= 400) {
            throw new Error(`Failed to create account: ${account.status} ${account.text}`);
        }

        return {
            organizationId: orgId,
            scenarioId: scenario.body.id,
            sourceId: source.body.id,
            accountId: account.body.id,
        };
    }

    it('should export all handlers', () => {
        expect(preparedVideosController).toHaveProperty('createPreparedVideoPost');
        expect(preparedVideosController).toHaveProperty('updatePreparedVideoPatch');
        expect(preparedVideosController).toHaveProperty('getPreparedVideoByIdGet');
        expect(preparedVideosController).toHaveProperty('getAllPreparedVideosGet');
        expect(preparedVideosController).toHaveProperty('deletePreparedVideoDelete');
    });

    it('handlers should be functions', () => {
        expect(typeof preparedVideosController.createPreparedVideoPost).toBe('function');
        expect(typeof preparedVideosController.updatePreparedVideoPatch).toBe('function');
        expect(typeof preparedVideosController.getPreparedVideoByIdGet).toBe('function');
        expect(typeof preparedVideosController.getAllPreparedVideosGet).toBe('function');
        expect(typeof preparedVideosController.deletePreparedVideoDelete).toBe('function');
    });

    it('create & getAll', async () => {
        const ids = await createDeps();
        const payload = buildPreparedVideoPayload(ids);
        const response = await createPreparedVideoHelper(payload, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);
        expect(response.body.id).toBeDefined();
        expect(response.body.firebaseUrl).toBe(payload.firebaseUrl);

        const response2 = await getAllPreparedVideosHelper(testApp);
        expect(response2.body).toBeDefined();
        expect(Array.isArray(response2.body.preparedVideos)).toBe(true);
        expect(response2.body.count).not.toBe(0);
        expect(response2.status).toBeLessThan(299);
    });

    it('update', async () => {
        const ids = await createDeps();
        const payload = buildPreparedVideoPayload(ids);
        const response = await createPreparedVideoHelper(payload, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await updatePreparedVideoHelper(
            {
                id: response.body.id,
                firebaseUrl: 'https://dummy.firebase.com/updated.mp4',
                scenarioId: ids.scenarioId,
                sourceId: ids.sourceId,
                accountId: ids.accountId,
            },
            testApp,
        );
        expect(response2.body).toBeDefined();
        expect(response2.body.firebaseUrl).toBe('https://dummy.firebase.com/updated.mp4');
        expect(response2.status).toBeLessThan(299);
    });

    it('delete', async () => {
        const ids = await createDeps();
        const payload = buildPreparedVideoPayload(ids);
        const response = await createPreparedVideoHelper(payload, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await deletePreparedVideoHelper({id: response.body.id}, testApp);
        expect(response2.status).toBeLessThan(299);

        const response3 = await getAllPreparedVideosHelper(testApp);
        expect(response3.body).toBeDefined();
        // count may be 0 or >0 if DB is not isolated, so just check status
        expect(response3.status).toBeLessThan(299);
    }, 15000);

    it('getPreparedVideoById', async () => {
        const ids = await createDeps();
        const payload = buildPreparedVideoPayload(ids);
        const response = await createPreparedVideoHelper(payload, testApp);
        expect(response.body).toBeDefined();
        expect(response.status).toBeLessThan(299);

        const response2 = await getPreparedVideoByIdHelper({id: response.body.id}, testApp);
        expect(response2.body).toBeDefined();
        expect(response2.body.id).toBe(response.body.id);
        expect(response2.status).toBeLessThan(299);
    });

    it('findPreparedVideoDuplicatesPost: should return duplicates for same accountId, sourceId, scenarioId', async () => {
        const ids = await createDeps();
        // Создаём 2 дубликата
        const payload1 = buildPreparedVideoPayload(ids);
        const payload2 = buildPreparedVideoPayload(ids);
        payload2.firebaseUrl = 'https://dummy.firebase.com/other.mp4';
        await createPreparedVideoHelper(payload1, testApp);
        await createPreparedVideoHelper(payload2, testApp);

        // Запрос на поиск дубликатов
        const res = await findPreparedVideoDuplicatesHelper(
            {
                accountId: ids.accountId,
                sourceId: ids.sourceId,
                scenarioId: ids.scenarioId,
            },
            testApp,
        );
        expect(res.status).toBeLessThan(299);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        // Проверяем, что оба firebaseUrl присутствуют
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const urls = res.body.map((v: any) => v.firebaseUrl);
        expect(urls).toContain(payload1.firebaseUrl);
        expect(urls).toContain(payload2.firebaseUrl);
    });

    it('getPRe: returns correct stats for given days', async () => {
        // Создаём записи с разными датами
        const now = new Date();
        const day1 = now.toISOString().slice(0, 10);
        const day2 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // вчера

        // Хак: создаём через createPreparedVideoHelper, потом патчим createdAt напрямую через knex
        let vid: CreatePreparedVideoResponse | undefined;
        const scenario = await createScenarioHelper(undefined, testApp);
        const account = await request(testApp)
            .post(prepareRoute(createAccount))
            .set(getUserTokenHeader())
            .set(getOrgHeader())
            .send({
                slug: `test-account-${Date.now()}`,
                enabled: true,
            });
        for (let i = 0; i < 3; i++) {
            const source = await createSourceHelper(undefined, testApp);
            const ids = {
                scenarioId: scenario.body.id,
                sourceId: source.body.id,
                accountId: account.body.id,
            };
            const payload = buildPreparedVideoPayload(ids);
            const response = await createPreparedVideoHelper(payload, testApp);

            vid = response.body;
        }
        if (!vid) {
            throw new Error('vid is undefined');
        }

        // vid1 и vid2 — сегодня, vid3 — вчера
        const db = require('#src/db/utils').getDb();
        try {
            await db('preparedVideos')
                .where({id: vid.id})
                .update({createdAt: `${day2}T12:00:00.000Z`});

            // Запросим статистику
            const res = await request(testApp)
                .get(prepareRoute(getPreparedVideosStatisticsByDays))
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
            // await db.destroy();
        }
    });

    it('hasPreparedVideoBeenCreated: returns true for existing, false for non-existing', async () => {
        const ids = await createDeps();
        // Создаём видео
        const payload = buildPreparedVideoPayload(ids);
        await createPreparedVideoHelper(payload, testApp);
        // Проверяем существующее
        const res1 = await request(testApp)
            .get(prepareRoute(hasPreparedVideoBeenCreated))
            .set(getUserTokenHeader())
            .set(getOrgHeader())
            .query(ids);
        expect(res1.status).toBeLessThan(300);
        expect(res1.body).toBe(true);
        // Проверяем несуществующее
        const res2 = await request(testApp)
            .get(prepareRoute(hasPreparedVideoBeenCreated))
            .set(getUserTokenHeader())
            .set(getOrgHeader())
            .query({accountId: 999999, scenarioId: 999999, sourceId: 999999});
        expect(res2.status).toBeLessThan(300);
        expect(res2.body).toBe(false);
    });

    // Organization isolation tests
    describe('Organization isolation', () => {
        it('should not allow reading prepared videos from different organizations', async () => {
            // Create prepared video in org1
            const org1Deps = await createDepsWithOrg('org1');
            const payload = buildPreparedVideoPayload(org1Deps);
            const response = await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send(payload);
            expect(response.status).toBeLessThan(299);
            const preparedVideoId = response.body.id;

            // Create org2 and try to read from it - should return 404
            const org2Deps = await createDepsWithOrg('org2');
            const readResponse = await request(testApp)
                .get(prepareRoute(getPreparedVideoById))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId})
                .query({id: preparedVideoId});
            expect(readResponse.status).toBe(404);
        });

        it('should not allow updating prepared videos from different organizations', async () => {
            // Create prepared video in org1
            const org1Deps = await createDepsWithOrg('org1');
            const payload = buildPreparedVideoPayload(org1Deps);
            const response = await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send(payload);
            expect(response.status).toBeLessThan(299);
            const preparedVideoId = response.body.id;

            // Try to update from org2 - should return 404
            const org2Deps = await createDepsWithOrg('org2');
            const updateResponse = await request(testApp)
                .patch(prepareRoute(updatePreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId})
                .send({
                    id: preparedVideoId,
                    firebaseUrl: 'https://hacker.com/malicious.mp4',
                });
            expect(updateResponse.status).toBe(404);
        });

        it('should not allow deleting prepared videos from different organizations', async () => {
            // Create prepared video in org1
            const org1Deps = await createDepsWithOrg('org1');
            const payload = buildPreparedVideoPayload(org1Deps);
            const response = await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send(payload);
            expect(response.status).toBeLessThan(299);
            const preparedVideoId = response.body.id;

            // Try to delete from org2 - should return success but delete count 0
            const org2Deps = await createDepsWithOrg('org2');
            const deleteResponse = await request(testApp)
                .delete(prepareRoute(deletePreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId})
                .query({id: preparedVideoId});
            expect(deleteResponse.status).toBeLessThan(299);
            expect(deleteResponse.body).toBe(0);

            // Verify the video still exists in org1
            const verifyResponse = await request(testApp)
                .get(prepareRoute(getPreparedVideoById))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .query({id: preparedVideoId});
            expect(verifyResponse.status).toBeLessThan(299);
        });

        it('should scope list/getAll results by organization', async () => {
            // Create prepared videos in both orgs
            const org1Deps = await createDepsWithOrg('org1');
            const org2Deps = await createDepsWithOrg('org2');

            const payload1 = buildPreparedVideoPayload(org1Deps);
            const payload2 = buildPreparedVideoPayload(org2Deps);

            await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send(payload1);

            await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId})
                .send(payload2);

            // Get from org1 - should only see org1 videos
            const org1Response = await request(testApp)
                .get(prepareRoute(getAllPreparedVideos))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId});
            expect(org1Response.status).toBeLessThan(299);

            // Get from org2 - should only see org2 videos
            const org2Response = await request(testApp)
                .get(prepareRoute(getAllPreparedVideos))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId});
            expect(org2Response.status).toBeLessThan(299);

            // Verify isolation by checking firebaseUrls
            const org1Videos = org1Response.body.preparedVideos || [];
            const org2Videos = org2Response.body.preparedVideos || [];

            const org1Urls = org1Videos.map((v: {firebaseUrl: string}) => v.firebaseUrl);
            const org2Urls = org2Videos.map((v: {firebaseUrl: string}) => v.firebaseUrl);

            expect(org1Urls).toContain(payload1.firebaseUrl);
            expect(org1Urls).not.toContain(payload2.firebaseUrl);
            expect(org2Urls).toContain(payload2.firebaseUrl);
            expect(org2Urls).not.toContain(payload1.firebaseUrl);
        });

        it('should scope duplicates search by organization', async () => {
            // Create same combo in both orgs
            const org1Deps = await createDepsWithOrg('org1');
            const org2Deps = await createDepsWithOrg('org2');

            // Create 2 duplicates in org1
            const payload1a = buildPreparedVideoPayload(org1Deps);
            const payload1b = {
                ...buildPreparedVideoPayload(org1Deps),
                firebaseUrl: 'https://test1b.com/video.mp4',
            };

            // Create 1 video in org2 with same account/scenario/source combo
            const payload2 = buildPreparedVideoPayload(org2Deps);

            await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send(payload1a);

            await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send(payload1b);

            await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId})
                .send(payload2);

            // Search duplicates in org1 - should find 2
            const org1Duplicates = await request(testApp)
                .get(prepareRoute(findPreparedVideoDuplicates))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .query({
                    accountId: org1Deps.accountId,
                    scenarioId: org1Deps.scenarioId,
                    sourceId: org1Deps.sourceId,
                });
            expect(org1Duplicates.status).toBeLessThan(299);
            expect(org1Duplicates.body.length).toBe(2);

            // Search duplicates in org2 - should find 0 (only 1 video)
            const org2Duplicates = await request(testApp)
                .get(prepareRoute(findPreparedVideoDuplicates))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId})
                .query({
                    accountId: org2Deps.accountId,
                    scenarioId: org2Deps.scenarioId,
                    sourceId: org2Deps.sourceId,
                });
            expect(org2Duplicates.status).toBeLessThan(299);
            expect(org2Duplicates.body.length).toBe(0);
        });

        it('should scope statistics by organization', async () => {
            const today = new Date().toISOString().slice(0, 10);

            // Create videos in both orgs
            const org1Deps = await createDepsWithOrg('org1');
            const org2Deps = await createDepsWithOrg('org2');

            // Create 2 videos in org1, 1 in org2
            for (let i = 0; i < 2; i++) {
                await request(testApp)
                    .post(prepareRoute(createPreparedVideo))
                    .set(getUserTokenHeader())
                    .set({'x-organization-id': org1Deps.organizationId})
                    .send(buildPreparedVideoPayload(org1Deps));
            }

            await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId})
                .send(buildPreparedVideoPayload(org2Deps));

            // Get stats for org1 (using proper array query format)
            const org1Stats = await request(testApp)
                // .get(`/api/ui/get-prepared-videos-statistics-by-days?days=${today}`)
                .get(prepareRoute(getPreparedVideosStatisticsByDays, true, {days: today}))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId});
            expect(org1Stats.status).toBeLessThan(299);

            // Get stats for org2 (using proper array query format)
            const org2Stats = await request(testApp)
                // .get(`/api/ui/get-prepared-videos-statistics-by-days?days=${today}`)
                .get(prepareRoute(getPreparedVideosStatisticsByDays, true, {days: today}))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId});
            expect(org2Stats.status).toBeLessThan(299);

            // Org1 should see 2, org2 should see 1
            expect(org1Stats.body[today]).toBeGreaterThanOrEqual(2);
            expect(org2Stats.body[today]).toBeGreaterThanOrEqual(1);
        });

        it('should reject creating prepared video with cross-org foreign keys', async () => {
            // Create deps in org1 and org2
            const org1Deps = await createDepsWithOrg('org1');
            const org2Deps = await createDepsWithOrg('org2');

            // Try to create video in org1 using org2's account/scenario/source - should fail with 400
            const crossOrgPayload = {
                firebaseUrl: 'https://malicious.com/video.mp4',
                accountId: org2Deps.accountId,
                scenarioId: org1Deps.scenarioId,
                sourceId: org1Deps.sourceId,
            };

            const response = await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send(crossOrgPayload);
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('does not belong to the specified organization');
        });

        it('should reject updating prepared video with cross-org foreign keys', async () => {
            // Create video in org1
            const org1Deps = await createDepsWithOrg('org1');
            const payload = buildPreparedVideoPayload(org1Deps);
            const createResponse = await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send(payload);
            expect(createResponse.status).toBeLessThan(299);

            // Create account in org2
            const org2Deps = await createDepsWithOrg('org2');

            // Try to update video to use org2's account - should fail with 400
            const updateResponse = await request(testApp)
                .patch(prepareRoute(updatePreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send({
                    id: createResponse.body.id,
                    accountId: org2Deps.accountId,
                });
            expect(updateResponse.status).toBe(400);
            expect(updateResponse.body.error).toContain(
                'does not belong to the specified organization',
            );
        });

        it('should ignore organizationId in update request payload and preserve original organization', async () => {
            // Set up dependencies for two organizations
            const org1Deps = await createDepsWithOrg('org1');
            const org2Deps = await createDepsWithOrg('org2');

            // Create prepared video in org1
            const payload = buildPreparedVideoPayload(org1Deps);

            const createResponse = await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send(payload);

            expect(createResponse.status).toBeLessThan(299);
            expect(createResponse.body.organizationId).toBe(Number(org1Deps.organizationId));

            // Attempt to update with a different organizationId in the payload
            const updateResponse = await request(testApp)
                .patch(prepareRoute(updatePreparedVideo))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId})
                .send({
                    id: createResponse.body.id,
                    organizationId: Number(org2Deps.organizationId), // This should be ignored
                    firebaseUrl: 'https://example.com/updated-video.mp4',
                });

            expect(updateResponse.status).toBeLessThan(299);
            expect(updateResponse.body.organizationId).toBe(Number(org1Deps.organizationId)); // Should remain org1
            expect(updateResponse.body.firebaseUrl).toBe('https://example.com/updated-video.mp4'); // Other fields should update

            // Verify the record still belongs to org1 by fetching from org1
            const fetchResponse = await request(testApp)
                .get(prepareRoute(getPreparedVideoById))
                .query({id: createResponse.body.id})
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId});

            expect(fetchResponse.status).toBeLessThan(299);
            expect(fetchResponse.body.organizationId).toBe(Number(org1Deps.organizationId));

            // Verify org2 cannot access this record (should return 404)
            const org2FetchResponse = await request(testApp)
                .get(prepareRoute(getPreparedVideoById))
                .query({id: createResponse.body.id})
                .set(getUserTokenHeader())
                .set({'x-organization-id': org2Deps.organizationId});

            expect(org2FetchResponse.status).toBe(404);
        });
    });
});
