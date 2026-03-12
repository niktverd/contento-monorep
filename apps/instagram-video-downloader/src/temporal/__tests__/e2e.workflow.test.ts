// // End-to-End Workflow Tests
// import {Client, Connection} from '@temporalio/client';
// import {NativeConnection, Runtime, Worker} from '@temporalio/worker';

// import * as activities from '../activities';
// import {videoProcessingWorkflow} from '../workflows/video-processing.workflow';

// import {VideoWorkflowInput, VideoWorkflowResult} from '#src/types/temporal';

// describe('End-to-End Workflow Tests', () => {
//     let nativeConnection: NativeConnection;
//     let connection: Connection;
//     let client: Client;
//     let worker: Worker;
//     let workerRunPromise: Promise<void>;

//     // Skip E2E tests by default unless TEMPORAL_E2E_TESTS=true
//     const shouldRunE2E = process.env.TEMPORAL_E2E_TESTS === 'true';

//     beforeAll(async () => {
//         if (!shouldRunE2E) {
//             console.log('Skipping E2E tests. Set TEMPORAL_E2E_TESTS=true to run.');
//             return;
//         }

//         // Configure runtime for E2E testing
//         Runtime.install({
//             logger: {
//                 log: () => {},
//                 trace: () => {},
//                 debug: () => {},
//                 info: () => {},
//                 warn: () => {},
//                 error: console.error,
//             },
//         });

//         try {
//             // Connect to local Temporal Server
//             const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
//             const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

//             nativeConnection = await NativeConnection.connect({address});
//             connection = await Connection.connect({address});

//             client = new Client({
//                 connection,
//                 namespace,
//             });

//             // Create and start worker
//             worker = await Worker.create({
//                 connection: nativeConnection,
//                 namespace,
//                 taskQueue: 'test-e2e-video-processing',
//                 workflowsPath: require.resolve('../workflows/video-processing.workflow'),
//                 activities,
//                 maxConcurrentActivityTaskExecutions: 1,
//             });

//             workerRunPromise = worker.run();
//         } catch (error) {
//             console.error('Failed to connect to Temporal Server:', error);
//             throw new Error('Temporal Server not available. Start with: temporal server start-dev');
//         }
//     }, 30000);

//     afterAll(async () => {
//         if (!shouldRunE2E) return;

//         if (worker) {
//             worker.shutdown();
//             await workerRunPromise;
//         }
//         if (nativeConnection) {
//             await nativeConnection.close();
//         }
//         if (connection) {
//             await connection.close();
//         }
//     }, 10000);

//     describe('Full Video Processing Pipeline', () => {
//         // Only run if E2E tests are enabled
//         (shouldRunE2E ? it : it.skip)(
//             'should process video workflow with mocked activities',
//             async () => {
//                 const workflowInput: VideoWorkflowInput = {
//                     sourceId: 999,
//                     accountId: 888,
//                     scenarioId: 777,
//                     firebaseUrl: 'https://test-firebase-url.com/test-video.mp4',
//                 };

//                 const handle = await client.workflow.start(videoProcessingWorkflow, {
//                     args: [workflowInput],
//                     taskQueue: 'test-e2e-video-processing',
//                     workflowId: `e2e-test-${Date.now()}-${Math.random()}`,
//                 });

//                 // Wait for workflow completion with timeout
//                 const result = await Promise.race([
//                     handle.result(),
//                     new Promise<never>((_, reject) =>
//                         setTimeout(() => reject(new Error('Workflow timeout')), 60000),
//                     ),
//                 ]);

//                 // Verify workflow result structure
//                 expect(result).toHaveProperty('success');
//                 expect(result).toHaveProperty('sourceId', 999);
//                 expect(result).toHaveProperty('accountId', 888);
//                 expect(result).toHaveProperty('scenarioId', 777);

//                 // Since we're using real activities that will fail with test data,
//                 // we expect the workflow to fail but return a structured error
//                 if (result.success) {
//                     // If somehow successful, verify all expected properties
//                     expect(result).toHaveProperty('downloadUrl');
//                     expect(result).toHaveProperty('processedUrl');
//                     expect(result).toHaveProperty('mediaContainerId');
//                     expect(result).toHaveProperty('postId');
//                     expect(result).toHaveProperty('permalinkUrl');
//                 } else {
//                     expect(result).toHaveProperty('error');
//                     expect(result).toHaveProperty('step');
//                     console.log('Expected workflow failure with test data:', result.error);
//                 }
//             },
//             70000,
//         );

//         (shouldRunE2E ? it : it.skip)(
//             'should handle workflow cancellation gracefully',
//             async () => {
//                 const workflowInput: VideoWorkflowInput = {
//                     sourceId: 999,
//                     accountId: 888,
//                     scenarioId: 777,
//                 };

//                 const handle = await client.workflow.start(videoProcessingWorkflow, {
//                     args: [workflowInput],
//                     taskQueue: 'test-e2e-video-processing',
//                     workflowId: `e2e-cancel-test-${Date.now()}-${Math.random()}`,
//                 });

//                 // Cancel workflow after a short delay
//                 setTimeout(async () => {
//                     await handle.cancel();
//                 }, 1000);

//                 try {
//                     await handle.result();
//                     fail('Expected workflow to be cancelled');
//                 } catch (error) {
//                     expect(error).toBeInstanceOf(Error);
//                     const errorMessage = (error as Error).message;
//                     expect(errorMessage).toContain('cancelled');
//                 }
//             },
//             30000,
//         );

//         (shouldRunE2E ? it : it.skip)(
//             'should track workflow status during execution',
//             async () => {
//                 const workflowInput: VideoWorkflowInput = {
//                     sourceId: 999,
//                     accountId: 888,
//                     scenarioId: 777,
//                     firebaseUrl: 'https://test-firebase-url.com/test-video.mp4',
//                 };

//                 const handle = await client.workflow.start(videoProcessingWorkflow, {
//                     args: [workflowInput],
//                     taskQueue: 'test-e2e-video-processing',
//                     workflowId: `e2e-status-test-${Date.now()}-${Math.random()}`,
//                 });

//                 // Check initial status
//                 const initialStatus = await handle.describe();
//                 expect(initialStatus.status.name).toBe('RUNNING');

//                 // Wait for completion
//                 const result = await handle.result();
//                 expect(result).toBeDefined();

//                 // Check final status
//                 const finalStatus = await handle.describe();
//                 expect(['COMPLETED', 'FAILED']).toContain(finalStatus.status.name);
//             },
//             60000,
//         );
//     });

//     describe('Workflow Error Scenarios', () => {
//         (shouldRunE2E ? it : it.skip)(
//             'should handle invalid input parameters',
//             async () => {
//                 const invalidInput = {
//                     sourceId: -1,
//                     accountId: 0,
//                     scenarioId: 999999,
//                 } as VideoWorkflowInput;

//                 const handle = await client.workflow.start(videoProcessingWorkflow, {
//                     args: [invalidInput],
//                     taskQueue: 'test-e2e-video-processing',
//                     workflowId: `e2e-invalid-test-${Date.now()}-${Math.random()}`,
//                 });

//                 const result = (await handle.result()) as VideoWorkflowResult;

//                 expect(result.success).toBe(false);
//                 expect(result.error).toBeDefined();
//                 expect(result.step).toBeDefined();
//             },
//             60000,
//         );

//         (shouldRunE2E ? it : it.skip)(
//             'should maintain workflow state across retries',
//             async () => {
//                 const workflowInput: VideoWorkflowInput = {
//                     sourceId: 999,
//                     accountId: 888,
//                     scenarioId: 777,
//                 };

//                 const handle = await client.workflow.start(videoProcessingWorkflow, {
//                     args: [workflowInput],
//                     taskQueue: 'test-e2e-video-processing',
//                     workflowId: `e2e-retry-test-${Date.now()}-${Math.random()}`,
//                 });

//                 const result = (await handle.result()) as VideoWorkflowResult;

//                 // Even if the workflow fails, it should maintain state consistency
//                 expect(result.sourceId).toBe(999);
//                 expect(result.accountId).toBe(888);
//                 expect(result.scenarioId).toBe(777);
//             },
//             60000,
//         );
//     });

//     describe('Workflow Performance and Reliability', () => {
//         (shouldRunE2E ? it : it.skip)(
//             'should handle multiple concurrent workflows',
//             async () => {
//                 const concurrentWorkflows = 3;
//                 const workflowPromises: Promise<VideoWorkflowResult>[] = [];

//                 for (let i = 0; i < concurrentWorkflows; i++) {
//                     const workflowInput: VideoWorkflowInput = {
//                         sourceId: 1000 + i,
//                         accountId: 2000 + i,
//                         scenarioId: 3000 + i,
//                         firebaseUrl: `https://test-firebase-url.com/test-video-${i}.mp4`,
//                     };

//                     const handle = await client.workflow.start(videoProcessingWorkflow, {
//                         args: [workflowInput],
//                         taskQueue: 'test-e2e-video-processing',
//                         workflowId: `e2e-concurrent-test-${i}-${Date.now()}-${Math.random()}`,
//                     });

//                     workflowPromises.push(handle.result() as Promise<VideoWorkflowResult>);
//                 }

//                 const results = await Promise.all(workflowPromises);

//                 expect(results).toHaveLength(concurrentWorkflows);
//                 results.forEach((result, index) => {
//                     expect(result.sourceId).toBe(1000 + index);
//                     expect(result.accountId).toBe(2000 + index);
//                     expect(result.scenarioId).toBe(3000 + index);
//                 });
//             },
//             120000,
//         );

//         (shouldRunE2E ? it : it.skip)(
//             'should complete workflow within reasonable time',
//             async () => {
//                 const startTime = Date.now();

//                 const workflowInput: VideoWorkflowInput = {
//                     sourceId: 999,
//                     accountId: 888,
//                     scenarioId: 777,
//                     firebaseUrl: 'https://test-firebase-url.com/test-video.mp4',
//                 };

//                 const handle = await client.workflow.start(videoProcessingWorkflow, {
//                     args: [workflowInput],
//                     taskQueue: 'test-e2e-video-processing',
//                     workflowId: `e2e-perf-test-${Date.now()}-${Math.random()}`,
//                 });

//                 await handle.result();

//                 const duration = Date.now() - startTime;
//                 expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
//             },
//             70000,
//         );
//     });

//     describe('Integration with Database', () => {
//         (shouldRunE2E ? it : it.skip)(
//             'should handle database connection issues gracefully',
//             async () => {
//                 // This test would require temporarily disrupting database connection
//                 // For now, we'll test that the workflow handles expected database errors

//                 const workflowInput: VideoWorkflowInput = {
//                     sourceId: 999999, // Non-existent source
//                     accountId: 999999, // Non-existent account
//                     scenarioId: 999999, // Non-existent scenario
//                 };

//                 const handle = await client.workflow.start(videoProcessingWorkflow, {
//                     args: [workflowInput],
//                     taskQueue: 'test-e2e-video-processing',
//                     workflowId: `e2e-db-test-${Date.now()}-${Math.random()}`,
//                 });

//                 const result = (await handle.result()) as VideoWorkflowResult;

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain('not found');
//                 expect(['download', 'process']).toContain(result.step);
//             },
//             60000,
//         );
//     });

//     describe('Test Environment Validation', () => {
//         it('should validate test environment setup', () => {
//             if (!shouldRunE2E) {
//                 expect(true).toBe(true); // Skip validation if E2E tests are disabled
//                 return;
//             }

//             // Validate required environment variables
//             expect(process.env.TEMPORAL_ADDRESS || 'localhost:7233').toBeDefined();
//             expect(process.env.TEMPORAL_NAMESPACE || 'default').toBeDefined();
//         });

//         it('should provide instructions for running E2E tests', () => {
//             if (!shouldRunE2E) {
//                 console.log(`
// E2E Tests Instructions:
// 1. Start Temporal Server: temporal server start-dev
// 2. Set environment: TEMPORAL_E2E_TESTS=true
// 3. Run tests: npm run test:temporal -- src/temporal/__tests__/e2e.workflow.test.ts

// Current environment:
// - TEMPORAL_E2E_TESTS: ${process.env.TEMPORAL_E2E_TESTS || 'false'}
// - TEMPORAL_ADDRESS: ${process.env.TEMPORAL_ADDRESS || 'localhost:7233'}
// - TEMPORAL_NAMESPACE: ${process.env.TEMPORAL_NAMESPACE || 'default'}
//                 `);
//             }
//             expect(true).toBe(true);
//         });
//     });
// });
