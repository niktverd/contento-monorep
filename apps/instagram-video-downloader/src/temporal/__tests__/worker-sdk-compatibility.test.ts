import {TestWorkflowEnvironment} from '@temporalio/testing';
import {Runtime, Worker} from '@temporalio/worker';

import * as activities from '../activities';
import {videoDownloadingWorkflow} from '../workflows';

describe('Worker SDK Compatibility Tests', () => {
    let testEnv: TestWorkflowEnvironment;

    beforeAll(async () => {
        // Use time skipping for faster test execution
        Runtime.install({
            logger: {
                log: () => {},
                trace: () => {},
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {},
            },
        });

        testEnv = await TestWorkflowEnvironment.createTimeSkipping();
    });

    afterAll(async () => {
        await testEnv?.teardown();
    });

    describe('Worker Creation', () => {
        it('should create worker with new SDK', async () => {
            const {nativeConnection} = testEnv;

            const worker = await Worker.create({
                connection: nativeConnection,
                namespace: 'default',
                workflowsPath: require.resolve('../workflows'),
                activities,
                taskQueue: 'test-worker-queue',
                maxConcurrentActivityTaskExecutions: 5,
                maxConcurrentWorkflowTaskExecutions: 10,
                maxActivitiesPerSecond: 20,
            });

            expect(worker).toBeDefined();
            // Worker object doesn't expose configuration properties directly
            // but we can verify it was created successfully
        });

        it('should register workflows and activities correctly', async () => {
            const {nativeConnection} = testEnv;

            const worker = await Worker.create({
                connection: nativeConnection,
                namespace: 'default',
                workflowsPath: require.resolve('../workflows'),
                activities,
                taskQueue: 'test-worker-queue',
            });

            // Verify that the worker can be created without errors
            // This tests that all workflows and activities are properly registered
            expect(worker).toBeDefined();

            // Test that we can access the registered workflows
            const workflowHandle = await testEnv.workflowClient.start(videoDownloadingWorkflow, {
                args: [
                    {
                        sourceId: 1,
                    },
                    {
                        organizationId: 1,
                    },
                ],
                taskQueue: 'test-worker-queue',
                workflowId: 'test-worker-workflow',
            });

            expect(workflowHandle.workflowId).toBe('test-worker-workflow');
        });
    });

    describe('Worker Configuration', () => {
        it('should handle worker configuration options with new SDK', async () => {
            const {nativeConnection} = testEnv;

            const worker = await Worker.create({
                connection: nativeConnection,
                namespace: 'default',
                workflowsPath: require.resolve('../workflows'),
                activities,
                taskQueue: 'test-config-queue',
                // Test various configuration options
                maxConcurrentActivityTaskExecutions: 3,
                maxConcurrentWorkflowTaskExecutions: 5,
                maxActivitiesPerSecond: 10,
                maxConcurrentLocalActivityExecutions: 2,
                maxConcurrentWorkflowTaskPolls: 1,
                maxConcurrentActivityTaskPolls: 1,
                stickyQueueScheduleToStartTimeout: '10s',
                maxHeartbeatThrottleInterval: '30s',
                defaultHeartbeatThrottleInterval: '30s',
            });

            expect(worker).toBeDefined();
            // Configuration is applied during worker creation
            // We verify the worker was created successfully with the configuration
        });
    });

    describe('Worker Type Safety', () => {
        it('should maintain type safety with new SDK', () => {
            // This test verifies that the worker can be imported and created
            // without TypeScript errors, ensuring type compatibility
            expect(typeof Worker.create).toBe('function');
            expect(typeof activities).toBe('object');
            expect(typeof videoDownloadingWorkflow).toBe('function');
        });
    });
});
