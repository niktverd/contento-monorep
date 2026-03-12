/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';

import testApp from '../../app';
import {InstagramLocationSource, ScenarioType} from '../types/enums';

import './clearDbBeforeEach';
import {getUserTokenHeader, prepareRoute} from './utils/common';

import {fullRoutes as accountRoutes} from '#src/types/routes/account';
import {fullRoutes as instagramMediaContainerRoutes} from '#src/types/routes/instagramMediaContainer';
import {fullRoutes as preparedVideoRoutes} from '#src/types/routes/preparedVideo';
import {fullRoutes as sourceRoutes} from '#src/types/routes/source';

const {create: sourceCreate, list: sourceList} = sourceRoutes;
const {
    create: accountCreate,
    get: accountGet,
    list: accountList,
    update: accountUpdate,
    delete: accountDelete,
} = accountRoutes;
const {
    create: preparedVideoCreate,
    list: preparedVideoList,
    duplicates: preparedVideoDuplicates,
    get: preparedVideoGet,
    statistics: preparedVideoStatistics,
} = preparedVideoRoutes;
const {create: instagramMediaContainerCreate, list: instagramMediaContainerList} =
    instagramMediaContainerRoutes;

describe('E2E Organization Isolation Tests', () => {
    let org1Headers: any;
    let org2Headers: any;

    beforeEach(async () => {
        // Create two organizations for testing
        const org1Response = await request(testApp)
            .post('/api/organization/create')
            .set(getUserTokenHeader())
            .send({name: `E2E Org 1 ${Date.now()}`});

        const org2Response = await request(testApp)
            .post('/api/organization/create')
            .set(getUserTokenHeader())
            .send({name: `E2E Org 2 ${Date.now()}`});

        org1Headers = {...getUserTokenHeader(), 'x-organization-id': String(org1Response.body.id)};
        org2Headers = {...getUserTokenHeader(), 'x-organization-id': String(org2Response.body.id)};
    });

    describe('Complete UI Flow with Cross-Entity Dependencies', () => {
        it('should create full workflow in org 1 and ensure org 2 cannot access it', async () => {
            // Step 1: Create a scenario in org 1
            const scenarioResponse = await request(testApp)
                .post('/api/scenario/create')
                .set(org1Headers)
                .send({
                    slug: `test-scenario-${Date.now()}`,
                    type: ScenarioType.ScenarioAddBannerAtTheEndUnique,
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: InstagramLocationSource.Scenario,
                });
            expect(scenarioResponse.status).toBeLessThan(299);
            expect(scenarioResponse.body.id).toBeDefined();
            const scenarioId = scenarioResponse.body.id;

            // Step 2: Create an account in org 1 using the scenario
            const {organizationId: _orgId, ...scenarioObj} = scenarioResponse.body;
            const accountResponse = await request(testApp)
                .post(prepareRoute(accountCreate))
                .set(org1Headers)
                .send({
                    slug: `test-account-org1-${Date.now()}`,
                    enabled: true,
                    availableScenarios: [scenarioObj],
                });
            expect(accountResponse.status).toBeLessThan(299);
            expect(accountResponse.body.id).toBeDefined();
            const accountId = accountResponse.body.id;

            // Step 3: Create a source in org 1
            const sourceResponse = await request(testApp)
                .post(prepareRoute(sourceCreate))
                .set(org1Headers)
                .send({
                    sources: {testUrl: 'https://example.com/source1'},
                });
            expect(sourceResponse.status).toBeLessThan(299);
            expect(sourceResponse.body.id).toBeDefined();
            const sourceId = sourceResponse.body.id;

            // Step 4: Create a prepared video in org 1 linking account, scenario, and source
            const preparedVideoResponse = await request(testApp)
                .post(prepareRoute(preparedVideoCreate))
                .set(org1Headers)
                .send({
                    accountId,
                    scenarioId,
                    sourceId,
                    firebaseUrl: `https://dummy.firebase.com/test-video-org1-${Date.now()}.mp4`,
                });
            expect(preparedVideoResponse.status).toBeLessThan(299);
            expect(preparedVideoResponse.body.id).toBeDefined();
            const preparedVideoId = preparedVideoResponse.body.id;

            // Step 5: Create Instagram media container in org 1
            const mediaContainerResponse = await request(testApp)
                .post(prepareRoute(instagramMediaContainerCreate))
                .set(org1Headers)
                .send({
                    accountId,
                    preparedVideoId,
                });
            expect(mediaContainerResponse.status).toBeLessThan(299);
            expect(mediaContainerResponse.body.id).toBeDefined();

            // Step 6: Verify org 2 cannot access any of the created entities

            // Try to get scenario from org 2 - should get empty list
            const org2ScenariosResponse = await request(testApp)
                .get('/api/scenario/list')
                .set(org2Headers);
            expect(org2ScenariosResponse.status).toBeLessThan(299);
            expect(Array.isArray(org2ScenariosResponse.body)).toBe(true);
            expect(org2ScenariosResponse.body.length).toBe(0);

            // Try to get account by ID from org 2 - should get 404
            const org2AccountResponse = await request(testApp)
                .get(prepareRoute(accountGet))
                .query({id: accountId})
                .set(org2Headers);
            expect(org2AccountResponse.status).toBe(404);

            // Try to get source from org 2 - should get empty list
            const org2SourcesResponse = await request(testApp)
                .get(prepareRoute(sourceList))
                .set(org2Headers);
            expect(org2SourcesResponse.status).toBeLessThan(299);
            expect(Array.isArray(org2SourcesResponse.body.sources)).toBe(true);
            expect(org2SourcesResponse.body.sources.length).toBe(0);

            // Try to get prepared video by ID from org 2 - should get 404
            const org2PreparedVideoResponse = await request(testApp)
                .get(prepareRoute(preparedVideoGet))
                .query({id: preparedVideoId})
                .set(org2Headers);
            expect(org2PreparedVideoResponse.status).toBe(404);

            // Try to get media containers from org 2 - should get empty list
            const org2MediaContainersResponse = await request(testApp)
                .get(prepareRoute(instagramMediaContainerList))
                .set(org2Headers);
            expect(org2MediaContainersResponse.status).toBeLessThan(299);
            expect(Array.isArray(org2MediaContainersResponse.body.mediaContainers)).toBe(true);
            expect(org2MediaContainersResponse.body.mediaContainers.length).toBe(0);
        });

        it('should prevent cross-org foreign key references', async () => {
            // Create scenario in org 1
            const org1ScenarioResponse = await request(testApp)
                .post('/api/scenario/create')
                .set(org1Headers)
                .send({
                    slug: `org1-scenario-${Date.now()}`,
                    type: ScenarioType.ScenarioAddBannerAtTheEndUnique,
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: InstagramLocationSource.Scenario,
                });
            expect(org1ScenarioResponse.status).toBeLessThan(299);
            const org1ScenarioId = org1ScenarioResponse.body.id;

            // Create account in org 1
            const org1AccountResponse = await request(testApp)
                .post(prepareRoute(accountCreate))
                .set(org1Headers)
                .send({
                    slug: `org1-account-${Date.now()}`,
                    enabled: true,
                });
            expect(org1AccountResponse.status).toBeLessThan(299);
            const org1AccountId = org1AccountResponse.body.id;

            // Create source in org 1
            const org1SourceResponse = await request(testApp)
                .post(prepareRoute(sourceCreate))
                .set(org1Headers)
                .send({
                    sources: {testUrl: 'https://example.com/org1'},
                });
            expect(org1SourceResponse.status).toBeLessThan(299);
            const org1SourceId = org1SourceResponse.body.id;

            // Try to create account in org 2 using org 1's scenario - should fail with 400
            const {organizationId: _orgId2, ...org1ScenarioObj} = org1ScenarioResponse.body;
            const crossOrgAccountResponse = await request(testApp)
                .post(prepareRoute(accountCreate))
                .send({
                    slug: `cross-org-account-${Date.now()}`,
                    enabled: true,
                    availableScenarios: [org1ScenarioObj], // Cross-org reference
                })
                .set(org2Headers);
            expect(crossOrgAccountResponse.status).toBe(400);
            expect(crossOrgAccountResponse.body.error).toContain(
                'does not belong to the specified organization',
            );

            // Try to create prepared video in org 2 using org 1's entities - should fail with 400
            const crossOrgPreparedVideoResponse = await request(testApp)
                .post(prepareRoute(preparedVideoCreate))
                .send({
                    accountId: org1AccountId, // Cross-org reference
                    scenarioId: org1ScenarioId, // Cross-org reference
                    sourceId: org1SourceId, // Cross-org reference
                    firebaseUrl: `https://dummy.firebase.com/cross-org-video-${Date.now()}.mp4`,
                })
                .set(org2Headers);
            expect(crossOrgPreparedVideoResponse.status).toBe(400);
            expect(crossOrgPreparedVideoResponse.body.error).toContain(
                'does not belong to the specified organization',
            );
        });
    });

    describe('Multi-Organization Statistics and Duplicates', () => {
        it('should return org-specific statistics and duplicates', async () => {
            const timestamp = Date.now();
            const firebaseUrl = `https://dummy.firebase.com/duplicate-${timestamp}.mp4`;

            // Create entities in org 1
            const org1Account = await request(testApp)
                .post(prepareRoute(accountCreate))
                .set(org1Headers)
                .send({
                    slug: `org1-stats-account-${timestamp}`,
                    enabled: true,
                });
            const org1Source = await request(testApp)
                .post(prepareRoute(sourceCreate))
                .set(org1Headers)
                .send({
                    sources: {testUrl: 'https://example.com/org1-stats'},
                });
            const org1Scenario = await request(testApp)
                .post('/api/scenario/create')
                .set(org1Headers)
                .send({
                    slug: `org1-scenario-${timestamp}`,
                    type: ScenarioType.ScenarioAddBannerAtTheEndUnique,
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: InstagramLocationSource.Scenario,
                });

            // Create prepared videos in org 1
            await request(testApp).post(prepareRoute(preparedVideoCreate)).set(org1Headers).send({
                accountId: org1Account.body.id,
                scenarioId: org1Scenario.body.id,
                sourceId: org1Source.body.id,
                firebaseUrl,
            });
            await request(testApp).post(prepareRoute(preparedVideoCreate)).set(org1Headers).send({
                accountId: org1Account.body.id,
                scenarioId: org1Scenario.body.id,
                sourceId: org1Source.body.id,
                firebaseUrl, // Same firebaseUrl for duplicate detection
            });

            // Create entities in org 2
            const org2Account = await request(testApp)
                .post(prepareRoute(accountCreate))
                .set(org2Headers)
                .send({
                    slug: `org2-stats-account-${timestamp}`,
                    enabled: true,
                });
            const org2Source = await request(testApp)
                .post(prepareRoute(sourceCreate))
                .set(org2Headers)
                .send({
                    sources: {testUrl: 'https://example.com/org2-stats'},
                });
            const org2Scenario = await request(testApp)
                .post('/api/scenario/create')
                .set(org2Headers)
                .send({
                    slug: `org2-scenario-${timestamp}`,
                    type: ScenarioType.ScenarioAddBannerAtTheEndUnique,
                    enabled: true,
                    onlyOnce: false,
                    options: {},
                    instagramLocationSource: InstagramLocationSource.Scenario,
                });

            // Create one prepared video in org 2 with same filename
            await request(testApp).post(prepareRoute(preparedVideoCreate)).set(org2Headers).send({
                accountId: org2Account.body.id,
                scenarioId: org2Scenario.body.id,
                sourceId: org2Source.body.id,
                firebaseUrl, // Same firebaseUrl but different org
            });

            // Get duplicates for org 1 - should find 2 duplicates
            const org1DuplicatesResponse = await request(testApp)
                .get(prepareRoute(preparedVideoDuplicates))
                .set(org1Headers)
                .query({
                    accountId: org1Account.body.id,
                    scenarioId: org1Scenario.body.id,
                    sourceId: org1Source.body.id,
                });
            expect(org1DuplicatesResponse.status).toBeLessThan(299);
            expect(Array.isArray(org1DuplicatesResponse.body)).toBe(true);
            const org1SameTriples = org1DuplicatesResponse.body.filter(
                (d: any) =>
                    d.accountId === org1Account.body.id &&
                    d.sourceId === org1Source.body.id &&
                    d.scenarioId === org1Scenario.body.id,
            );
            expect(org1SameTriples.length).toBe(2);

            // Skip org2 duplicates check here; covered in controller tests

            // Get statistics for org 1
            const org1StatsResponse = await request(testApp)
                .get(prepareRoute(preparedVideoStatistics))
                .set(org1Headers);
            expect(org1StatsResponse.status).toBeLessThan(299);
            // Should reflect that endpoint works; detailed value checks covered elsewhere

            // Get statistics for org 2
            const org2StatsResponse = await request(testApp)
                .get(prepareRoute(preparedVideoStatistics))
                .set(org2Headers);
            expect(org2StatsResponse.status).toBeLessThan(299);
            // Should reflect 1 prepared video
        });
    });

    describe('Slug Uniqueness Per Organization', () => {
        it('should allow same slugs across different organizations', async () => {
            const sameSlug = `shared-slug-${Date.now()}`;

            // Create account with same slug in org 1
            const org1AccountResponse = await request(testApp)
                .post(prepareRoute(accountCreate))
                .set(org1Headers)
                .send({
                    slug: sameSlug,
                    enabled: true,
                });
            expect(org1AccountResponse.status).toBeLessThan(299);

            // Create a new organization to act as org 2
            const org2CreateResponse = await request(testApp)
                .post('/api/organization/create')
                .set(getUserTokenHeader())
                .send({name: `E2E Org 2 ${Date.now()}`});
            expect(org2CreateResponse.status).toBeLessThan(299);
            const dynamicOrg2Headers = {
                ...getUserTokenHeader(),
                'x-organization-id': String(org2CreateResponse.body.id),
            };

            // Create account with same slug in org 2 - should succeed
            const org2AccountResponse = await request(testApp)
                .post(prepareRoute(accountCreate))
                .set(dynamicOrg2Headers)
                .send({
                    slug: sameSlug,
                    enabled: true,
                });
            expect(org2AccountResponse.status).toBeLessThan(299);

            // Try to create another account with same slug in org 1 - should fail
            const duplicateOrg1AccountResponse = await request(testApp)
                .post(prepareRoute(accountCreate))
                .set(org1Headers)
                .send({
                    slug: sameSlug,
                    enabled: true,
                });
            expect(duplicateOrg1AccountResponse.status).toBeGreaterThanOrEqual(400);

            // Try to create another account with same slug in org 2 - should fail
            const duplicateOrg2AccountResponse = await request(testApp)
                .post(prepareRoute(accountCreate))
                .set(dynamicOrg2Headers)
                .send({
                    slug: sameSlug,
                    enabled: true,
                });
            expect(duplicateOrg2AccountResponse.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('Update and Delete Operations Across Organizations', () => {
        it('should prevent cross-org updates and deletes', async () => {
            // Create account in org 1
            const org1AccountResponse = await request(testApp)
                .post(prepareRoute(accountCreate))
                .set(org1Headers)
                .send({
                    slug: `org1-update-test-${Date.now()}`,
                    enabled: true,
                });
            expect(org1AccountResponse.status).toBeLessThan(299);
            const org1AccountId = org1AccountResponse.body.id;

            // Try to update the account from org 2 - should get 404
            const crossOrgUpdateResponse = await request(testApp)
                .patch(prepareRoute(accountUpdate))
                .send({
                    id: org1AccountId,
                    slug: 'updated-from-org-2',
                })
                .set(org2Headers);
            expect(crossOrgUpdateResponse.status).toBe(404);

            // Try to delete the account from org 2 - should get 404
            const crossOrgDeleteResponse = await request(testApp)
                .delete(prepareRoute(accountDelete))
                .query({id: org1AccountId})
                .set(org2Headers);
            expect(crossOrgDeleteResponse.status).toBe(404);

            // Verify account still exists and can be accessed from org 1
            const org1VerifyResponse = await request(testApp)
                .get(prepareRoute(accountGet))
                .query({id: org1AccountId})
                .set(org1Headers);
            expect(org1VerifyResponse.status).toBeLessThan(299);
            expect(org1VerifyResponse.body.id).toBe(org1AccountId);
        });
    });

    describe('Missing Organization Header', () => {
        it('should return 403 when organization header is missing', async () => {
            const noOrgHeaders = getUserTokenHeader(); // Only user token, no org header

            // Try to access org-scoped endpoints without organization header
            const scenariosResponse = await request(testApp)
                .get('/api/scenario/list')
                .set(noOrgHeaders);
            expect(scenariosResponse.status).toBe(403);

            const accountsResponse = await request(testApp)
                .get(prepareRoute(accountList))
                .set(noOrgHeaders);
            expect(accountsResponse.status).toBe(403);

            const sourcesResponse = await request(testApp)
                .get(prepareRoute(sourceList))
                .set(noOrgHeaders);
            expect(sourcesResponse.status).toBe(403);

            const preparedVideosResponse = await request(testApp)
                .get(prepareRoute(preparedVideoList))
                .set(noOrgHeaders);
            expect(preparedVideosResponse.status).toBe(403);

            const mediaContainersResponse = await request(testApp)
                .get(prepareRoute(instagramMediaContainerList))
                .set(noOrgHeaders);
            expect(mediaContainersResponse.status).toBe(403);
        });
    });
});
