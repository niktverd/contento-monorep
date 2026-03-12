import request from 'supertest';

import testApp from '../../app';
import * as controller from '../sections/cloud-run-scenario-execution/cloud-run-scenario-execution.controller';
import {CloudRunScenarioExecutionStatusEnum} from '../types/enums';
import {fullRoutes as cloudRunScenarioExecutionRoutes} from '../types/routes/cloudRunScenarioExecution';
import {fullRoutes as organizationRoutes} from '../types/routes/organization';

import {
    createCloudRunScenarioExecutionHelper,
    getCloudRunScenarioExecutionHelper,
    updateCloudRunScenarioExecutionHelper,
} from './utils/cloudRunScenarioExecutions';
import {getUserTokenHeader, prepareRoute} from './utils/common';

// import './clearDbBeforeEach';

describe('cloud-run-scenario-executions.controller', () => {
    it('should export all handlers', () => {
        expect(controller).toHaveProperty('createCloudRunScenarioExecutionPost');
        expect(controller).toHaveProperty('getAllCloudRunScenarioExecutionGet');
        expect(controller).toHaveProperty('updateCloudRunScenarioExecutionStatusPatch');
    });

    it('handlers should be functions', () => {
        expect(typeof controller.createCloudRunScenarioExecutionPost).toBe('function');
        expect(typeof controller.getAllCloudRunScenarioExecutionGet).toBe('function');
        expect(typeof controller.updateCloudRunScenarioExecutionStatusPatch).toBe('function');
    });

    const messageId = 'test-message-id';
    const attempt = 1;
    const basePayload = {
        messageId,
        accountId: 1,
        scenarioId: 1,
        sourceId: 1,
        status: CloudRunScenarioExecutionStatusEnum.InProgress,
        reqId: 'test-req-id',
        attempt,
        queueName: 'test-queue-name',
    };

    it('create & get', async () => {
        const resCreate = await createCloudRunScenarioExecutionHelper(basePayload);
        expect(resCreate.status).toBeLessThan(300);
        expect(resCreate.body).toBeDefined();
        expect(resCreate.body.messageId).toBe(messageId);
        expect(resCreate.body.attempt).toBe(attempt);

        const resGet = await getCloudRunScenarioExecutionHelper({});
        expect(resGet.status).toBeLessThan(300);
        expect(resGet.body).toBeDefined();
        expect(resGet.body.executions[0].messageId).toBe(messageId);
        expect(resGet.body.executions[0].attempt).toBe(attempt);
    });

    it('update', async () => {
        const resCreate = await createCloudRunScenarioExecutionHelper(basePayload);

        const update = {status: CloudRunScenarioExecutionStatusEnum.Success};
        const resPatch = await updateCloudRunScenarioExecutionHelper({
            id: resCreate.body.id,
            ...update,
        });
        expect(resPatch.status).toBeLessThan(300);
        expect(resPatch.body).toBeDefined();
        expect(resPatch.body.status).toBe(update.status);
    });

    describe('organization isolation', () => {
        it('should isolate cloud run executions between organizations', async () => {
            // Create two organizations for testing
            const org1Response = await request(testApp)
                .post(prepareRoute(organizationRoutes.create))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post(prepareRoute(organizationRoutes.create))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            // Create execution in org 1
            const org1ExecutionResponse = await request(testApp)
                .post(prepareRoute(cloudRunScenarioExecutionRoutes.create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    ...basePayload,
                    messageId: `org1-execution-${Date.now()}`,
                });
            expect(org1ExecutionResponse.status).toBeLessThan(299);

            // Create execution in org 2
            const org2ExecutionResponse = await request(testApp)
                .post(prepareRoute(cloudRunScenarioExecutionRoutes.create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .send({
                    ...basePayload,
                    messageId: `org2-execution-${Date.now()}`,
                });
            expect(org2ExecutionResponse.status).toBeLessThan(299);

            // Org 1 should only see its execution
            const org1GetResponse = await request(testApp)
                .get(prepareRoute(cloudRunScenarioExecutionRoutes.list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .query({});

            expect(org1GetResponse.status).toBeLessThan(299);
            expect(org1GetResponse.body.executions).toBeDefined();
            const org1Executions = org1GetResponse.body.executions;
            expect(
                org1Executions.some(
                    (exec: {id: number}) => exec.id === org1ExecutionResponse.body.id,
                ),
            ).toBe(true);
            expect(
                org1Executions.some(
                    (exec: {id: number}) => exec.id === org2ExecutionResponse.body.id,
                ),
            ).toBe(false);

            // Org 2 should only see its execution
            const org2GetResponse = await request(testApp)
                .get(prepareRoute(cloudRunScenarioExecutionRoutes.list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .query({});

            expect(org2GetResponse.status).toBeLessThan(299);
            expect(org2GetResponse.body.executions).toBeDefined();
            const org2Executions = org2GetResponse.body.executions;
            expect(
                org2Executions.some(
                    (exec: {id: number}) => exec.id === org2ExecutionResponse.body.id,
                ),
            ).toBe(true);
            expect(
                org2Executions.some(
                    (exec: {id: number}) => exec.id === org1ExecutionResponse.body.id,
                ),
            ).toBe(false);
        });

        it('should not allow updating executions from different organization', async () => {
            // Create two organizations for testing
            const org1Response = await request(testApp)
                .post(prepareRoute(organizationRoutes.create))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post(prepareRoute(organizationRoutes.create))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            // Create execution in org 1
            const org1ExecutionResponse = await request(testApp)
                .post(prepareRoute(cloudRunScenarioExecutionRoutes.create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    ...basePayload,
                    messageId: `cross-org-test-${Date.now()}`,
                });
            expect(org1ExecutionResponse.status).toBeLessThan(299);

            // Try to update it from org 2 - should fail with 404
            const org2UpdateResponse = await request(testApp)
                .patch(prepareRoute(cloudRunScenarioExecutionRoutes.update))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .send({
                    id: org1ExecutionResponse.body.id,
                    status: CloudRunScenarioExecutionStatusEnum.Success,
                });

            expect(org2UpdateResponse.status).toBe(404);
            expect(org2UpdateResponse.body.error).toBe('Execution not found');
        });

        it('should apply filters per organization', async () => {
            // Create two organizations for testing
            const org1Response = await request(testApp)
                .post(prepareRoute(organizationRoutes.create))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 1'});
            expect(org1Response.status).toBeLessThan(299);

            const org2Response = await request(testApp)
                .post(prepareRoute(organizationRoutes.create))
                .set(getUserTokenHeader())
                .send({name: 'Test Org 2'});
            expect(org2Response.status).toBeLessThan(299);

            const uniqueMessageId = `filter-test-${Date.now()}`;

            // Create execution with same messageId in both orgs
            const org1ExecutionResponse = await request(testApp)
                .post(prepareRoute(cloudRunScenarioExecutionRoutes.create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .send({
                    ...basePayload,
                    messageId: uniqueMessageId,
                    status: CloudRunScenarioExecutionStatusEnum.InProgress,
                });
            expect(org1ExecutionResponse.status).toBeLessThan(299);

            const org2ExecutionResponse = await request(testApp)
                .post(prepareRoute(cloudRunScenarioExecutionRoutes.create))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .send({
                    ...basePayload,
                    messageId: uniqueMessageId,
                    status: CloudRunScenarioExecutionStatusEnum.Success,
                });
            expect(org2ExecutionResponse.status).toBeLessThan(299);

            // Filter by messageId in org 1 - should only find org 1's execution
            const org1FilterResponse = await request(testApp)
                .get(prepareRoute(cloudRunScenarioExecutionRoutes.list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org1Response.body.id)})
                .query({messageId: uniqueMessageId});

            expect(org1FilterResponse.status).toBeLessThan(299);
            expect(org1FilterResponse.body.executions).toBeDefined();
            expect(org1FilterResponse.body.executions.length).toBe(1);
            expect(org1FilterResponse.body.executions[0].id).toBe(org1ExecutionResponse.body.id);
            expect(org1FilterResponse.body.executions[0].status).toBe(
                CloudRunScenarioExecutionStatusEnum.InProgress,
            );

            // Filter by status in org 2 - should only find org 2's execution
            const org2FilterResponse = await request(testApp)
                .get(prepareRoute(cloudRunScenarioExecutionRoutes.list))
                .set(getUserTokenHeader())
                .set({'x-organization-id': String(org2Response.body.id)})
                .query({status: CloudRunScenarioExecutionStatusEnum.Success});

            expect(org2FilterResponse.status).toBeLessThan(299);
            expect(org2FilterResponse.body.executions).toBeDefined();
            expect(org2FilterResponse.body.executions.length).toBe(1);
            expect(org2FilterResponse.body.executions[0].id).toBe(org2ExecutionResponse.body.id);
            expect(org2FilterResponse.body.executions[0].status).toBe(
                CloudRunScenarioExecutionStatusEnum.Success,
            );
        });

        it('should enforce organization ID requirement', async () => {
            // Test create without organization header - SuperAdmin gets 400 from DB layer
            const createResponse = await request(testApp)
                .post(prepareRoute(cloudRunScenarioExecutionRoutes.create))
                .set(getUserTokenHeader())
                .send(basePayload);

            expect(createResponse.status).toBe(403);
            expect(createResponse.body.error).toContain('x-organization-id header is required');

            // Test get without organization header - gets 403 from middleware
            const getResponse = await request(testApp)
                .get(prepareRoute(cloudRunScenarioExecutionRoutes.list))
                .set(getUserTokenHeader());

            expect(getResponse.status).toBe(403);
            expect(getResponse.body.error).toContain('x-organization-id header is required');

            // Test update without organization header - gets 403 from middleware
            const updateResponse = await request(testApp)
                .patch(prepareRoute(cloudRunScenarioExecutionRoutes.update))
                .set(getUserTokenHeader())
                .send({
                    id: 1,
                    status: CloudRunScenarioExecutionStatusEnum.Success,
                });

            expect(updateResponse.status).toBe(403);
            expect(updateResponse.body.error).toContain('x-organization-id header is required');
        });
    });
});
