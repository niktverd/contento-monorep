import request from 'supertest';

import testApp from '../../app';

// import './clearDbBeforeEach';
import {createDynamicOrgHeaders, getUserTokenHeader, prepareRoute} from './utils/common';

import {fullRoutes as accountRoutes} from '#src/types/routes/account';
import {fullRoutes as instagramMediaContainerRoutes} from '#src/types/routes/instagramMediaContainer';
import {fullRoutes as preparedVideoRoutes} from '#src/types/routes/preparedVideo';
import {fullRoutes} from '#src/types/routes/scenario';
import {fullRoutes as sourceRoutes} from '#src/types/routes/source';

const {create: createScenario} = fullRoutes;
const {create: createSource} = sourceRoutes;
const {create: createAccount} = accountRoutes;
const {create: createPreparedVideo} = preparedVideoRoutes;
const {
    create: createInstagramMediaContainer,
    get: getInstagramMediaContainer,
    statistics: getInstagramMediaContainerStatistics,
} = instagramMediaContainerRoutes;

describe('instagram-media-containers.controller', () => {
    // Helper to create deps with organization 1 (which should already exist)
    async function createDepsWithOrg1() {
        const orgId = 1; // Use organization 1 which should exist
        const getOrgHeaderForOrg = () => ({'x-organization-id': orgId.toString()});

        const scenario = await request(testApp)
            .post(prepareRoute(createScenario))
            .set(getUserTokenHeader())
            .set(getOrgHeaderForOrg())
            .send({
                slug: `test-scenario-ig-media-${Date.now()}`,
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
                slug: `test-account-ig-media-${Date.now()}`,
                enabled: true,
            });

        if (account.status >= 400) {
            throw new Error(`Failed to create account: ${account.status} ${account.text}`);
        }

        // Create prepared video within the same organization
        const preparedVideo = await request(testApp)
            .post(prepareRoute(createPreparedVideo))
            .set(getUserTokenHeader())
            .set(getOrgHeaderForOrg())
            .send({
                firebaseUrl: `https://dummy.firebase.com/video-ig-media-${Date.now()}.mp4`,
                scenarioId: scenario.body.id,
                sourceId: source.body.id,
                accountId: account.body.id,
            });

        if (preparedVideo.status >= 400) {
            throw new Error(
                `Failed to create prepared video: ${preparedVideo.status} ${preparedVideo.text}`,
            );
        }

        return {
            organizationId: orgId,
            scenarioId: scenario.body.id,
            sourceId: source.body.id,
            accountId: account.body.id,
            preparedVideoId: preparedVideo.body.id,
        };
    }

    function buildInstagramMediaContainerPayload(deps: {
        preparedVideoId: number;
        accountId: number;
    }) {
        return {
            preparedVideoId: deps.preparedVideoId,
            accountId: deps.accountId,
        };
    }

    it('getInstagramMediaContainersStatisticsByDays: returns correct stats for given days', async () => {
        // Use organization 1 which should already exist
        const deps = await createDepsWithOrg1();

        const basePayload = buildInstagramMediaContainerPayload(deps);
        const now = new Date();
        const day1 = now.toISOString().slice(0, 10);
        const day2 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        // Test creating a container
        const container1Response = await request(testApp)
            .post(prepareRoute(createInstagramMediaContainer))
            .set(getUserTokenHeader())
            .set({'x-organization-id': deps.organizationId.toString()})
            .send(basePayload);

        if (container1Response.status >= 300) {
            console.log(
                'Error creating container:',
                container1Response.status,
                container1Response.text,
            );
            console.log('Payload:', basePayload);
            console.log('Organization ID:', deps.organizationId);
        }
        expect(container1Response.status).toBeLessThan(300);

        // Test the statistics endpoint
        const res = await request(testApp)
            .get(prepareRoute(getInstagramMediaContainerStatistics))
            .set(getUserTokenHeader())
            .set({'x-organization-id': deps.organizationId.toString()})
            .query({days: [day1, day2]});

        expect(res.status).toBeLessThan(300);
        expect(res.body).toBeDefined();
        expect(typeof res.body).toBe('object');
        // Should have at least 1 container today (could be more from other tests)
        expect(res.body[day1]).toBeGreaterThanOrEqual(1);
        expect(res.body[day2]).toBeGreaterThanOrEqual(0);
    });

    describe('cross-organization validation', () => {
        it('should reject creating media container with cross-org foreign keys', async () => {
            // Create deps in org1
            const org1Deps = await createDepsWithOrg1();

            // Create deps in a different organization using dynamic org creation
            const org2Headers = await createDynamicOrgHeaders(testApp, 'Test Org 2 for IG Media');

            // Create an account in the different organization
            const org2Account = await request(testApp)
                .post(prepareRoute(createAccount))
                .set(org2Headers)
                .send({
                    slug: `test-account-cross-org-${Date.now()}`,
                    enabled: true,
                });

            if (org2Account.status >= 400) {
                throw new Error(
                    `Failed to create org2 account: ${org2Account.status} ${org2Account.text}`,
                );
            }

            // Try to create media container in org1 using org2's account - should fail with 400
            const crossOrgPayload = {
                preparedVideoId: org1Deps.preparedVideoId,
                accountId: org2Account.body.id, // Cross-org FK
            };

            const response = await request(testApp)
                .post(prepareRoute(createInstagramMediaContainer))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId.toString()})
                .send(crossOrgPayload);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('does not belong to the specified organization');
        });

        it('should reject creating media container with cross-org prepared video', async () => {
            // Create deps in org1
            const org1Deps = await createDepsWithOrg1();

            // Create deps in a different organization using dynamic org creation
            const org2Headers = await createDynamicOrgHeaders(testApp, 'Test Org 3 for IG Media');

            // Create scenario, source, account in org2
            const org2Scenario = await request(testApp)
                .post(prepareRoute(createScenario))
                .set(org2Headers)
                .send({
                    slug: `test-scenario-cross-org-${Date.now()}`,
                    type: 'ScenarioAddBannerAtTheEndUnique',
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: 'scenario',
                });

            const org2Source = await request(testApp)
                .post(prepareRoute(createSource))
                .set(org2Headers)
                .send({sources: {foo: 'bar'}});

            const org2Account = await request(testApp)
                .post(prepareRoute(createAccount))
                .set(org2Headers)
                .send({
                    slug: `test-account-cross-org2-${Date.now()}`,
                    enabled: true,
                });

            // Create prepared video in org2
            const org2PreparedVideo = await request(testApp)
                .post(prepareRoute(createPreparedVideo))
                .set(org2Headers)
                .send({
                    firebaseUrl: `https://dummy.firebase.com/video-cross-org-${Date.now()}.mp4`,
                    scenarioId: org2Scenario.body.id,
                    sourceId: org2Source.body.id,
                    accountId: org2Account.body.id,
                });

            // Try to create media container in org1 using org2's prepared video - should fail with 400
            const crossOrgPayload = {
                preparedVideoId: org2PreparedVideo.body.id, // Cross-org FK
                accountId: org1Deps.accountId,
            };

            const response = await request(testApp)
                .post(prepareRoute(createInstagramMediaContainer))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId.toString()})
                .send(crossOrgPayload);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('does not belong to the specified organization');
        });

        it('should return 404 when trying to access media container from different organization', async () => {
            // Create deps in org1
            const org1Deps = await createDepsWithOrg1();

            // Create media container in org1
            const mediaContainerPayload = buildInstagramMediaContainerPayload(org1Deps);
            const createResponse = await request(testApp)
                .post(prepareRoute(createInstagramMediaContainer))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId.toString()})
                .send(mediaContainerPayload);

            expect(createResponse.status).toBeLessThan(299);

            // Create different organization
            const org2Headers = await createDynamicOrgHeaders(testApp, 'Test Org for 404 access');

            // Try to get media container from org2 - should return 404
            const getResponse = await request(testApp)
                .get(prepareRoute(getInstagramMediaContainer))
                .query({id: createResponse.body.id})
                .set(org2Headers);

            expect(getResponse.status).toBe(404);
        });

        it('should return 404 when trying to update media container from different organization', async () => {
            // Create deps in org1
            const org1Deps = await createDepsWithOrg1();

            // Create media container in org1
            const mediaContainerPayload = buildInstagramMediaContainerPayload(org1Deps);
            const createResponse = await request(testApp)
                .post(prepareRoute(createInstagramMediaContainer))
                .set(getUserTokenHeader())
                .set({'x-organization-id': org1Deps.organizationId.toString()})
                .send(mediaContainerPayload);

            expect(createResponse.status).toBeLessThan(299);

            // Create different organization
            const org2Headers = await createDynamicOrgHeaders(testApp, 'Test Org for 404 update');

            // Try to update media container from org2 - should return 404
            const updateResponse = await request(testApp)
                .patch(prepareRoute(instagramMediaContainerRoutes.update))
                .set(org2Headers)
                .send({
                    id: createResponse.body.id,
                    mediaId: 'updated-media-id',
                });

            expect(updateResponse.status).toBe(404);
        });
    });
});
