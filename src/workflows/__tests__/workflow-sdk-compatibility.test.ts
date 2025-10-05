// import {TestWorkflowEnvironment} from '@temporalio/testing';
// import {Runtime} from '@temporalio/worker';

// import {
//     publishingScheduleWorkflow,
//     videoDownloadingWorkflow,
//     videoProcessingWorkflow,
//     videoPublishingWorkflow,
// } from '../index';

// import {ScenarioType} from '#src/types/enums';

// describe('Workflow SDK Compatibility Tests', () => {
//     let testEnv: TestWorkflowEnvironment;

//     beforeAll(async () => {
//         // Use time skipping for faster test execution
//         Runtime.install({
//             logger: {
//                 log: () => {},
//                 trace: () => {},
//                 debug: () => {},
//                 info: () => {},
//                 warn: () => {},
//                 error: () => {},
//             },
//         });

//         testEnv = await TestWorkflowEnvironment.createTimeSkipping();
//     });

//     afterAll(async () => {
//         await testEnv?.teardown();
//     });

//     describe('Workflow Initialization', () => {
//         it('should initialize videoDownloadingWorkflow with new SDK', async () => {
//             const mockActivities = {
//                 downloadVideo: jest.fn(),
//                 getAccountsActivity: jest.fn(),
//                 runProcessingActivity: jest.fn(),
//             };

//             mockActivities.downloadVideo.mockResolvedValue({
//                 success: true,
//                 source: {
//                     id: 1,
//                     sources: {},
//                     firebaseUrl: 'https://firebase.com/test.mp4',
//                     duration: 30,
//                 },
//             });

//             const {workflowClient} = testEnv;
//             const handle = await workflowClient.start(videoDownloadingWorkflow, {
//                 args: [
//                     {
//                         sourceId: 1,
//                     },
//                     {
//                         organizationId: 1,
//                     },
//                 ],
//                 taskQueue: 'test-queue',
//                 workflowId: 'test-workflow-1',
//             });

//             expect(handle.workflowId).toBe('test-workflow-1');
//             expect(handle.firstExecutionRunId).toBeDefined();
//         });

//         it('should initialize videoProcessingWorkflow with new SDK', async () => {
//             const mockActivities = {
//                 processVideo: jest.fn(),
//             };

//             mockActivities.processVideo.mockResolvedValue({
//                 success: true,
//                 processedUrl: 'https://firebase.com/processed.mp4',
//                 duration: 45,
//             });

//             const {workflowClient} = testEnv;
//             const handle = await workflowClient.start(videoProcessingWorkflow, {
//                 args: [
//                     {
//                         source: {
//                             id: 1,
//                             sources: {},
//                             firebaseUrl: 'https://firebase.com/video.mp4',
//                             duration: 30,
//                         },
//                         account: {
//                             id: 1,
//                             slug: 'test-account',
//                             enabled: true,
//                             organizationId: 1,
//                         },
//                         scenario: {
//                             id: 1,
//                             slug: 'test-scenario',
//                             type: ScenarioType.ScenarioAddBannerAtTheEndUnique,
//                             enabled: true,
//                         },
//                     },
//                 ],
//                 taskQueue: 'test-queue',
//                 workflowId: 'test-workflow-2',
//             });

//             expect(handle.workflowId).toBe('test-workflow-2');
//             expect(handle.firstExecutionRunId).toBeDefined();
//         });

//         it('should initialize videoPublishingWorkflow with new SDK', async () => {
//             const mockActivities = {
//                 createInstagramContainer: jest.fn(),
//                 publishInstagramPost: jest.fn(),
//                 getAccountsActivity: jest.fn(),
//                 getRandomPreparedVideForAccountActivity: jest.fn(),
//                 runPublishingActivity: jest.fn(),
//                 getOrganizationsActivity: jest.fn(),
//             };

//             mockActivities.createInstagramContainer.mockResolvedValue({
//                 success: true,
//                 containerId: '123',
//             });

//             const {workflowClient} = testEnv;
//             const handle = await workflowClient.start(videoPublishingWorkflow, {
//                 args: [
//                     {
//                         id: 1,
//                         sourceId: 1,
//                         firebaseUrl: 'https://firebase.com/processed.mp4',
//                         duration: 45,
//                         scenarioId: 1,
//                         accountId: 1,
//                     },
//                     {
//                         id: 1,
//                         slug: 'test-account',
//                         enabled: true,
//                         organizationId: 1,
//                     },
//                 ],
//                 taskQueue: 'test-queue',
//                 workflowId: 'test-workflow-3',
//             });

//             expect(handle.workflowId).toBe('test-workflow-3');
//             expect(handle.firstExecutionRunId).toBeDefined();
//         });

//         it('should initialize publishingScheduleWorkflow with new SDK', async () => {
//             const mockActivities = {
//                 createInstagramContainer: jest.fn(),
//                 publishInstagramPost: jest.fn(),
//                 getAccountsActivity: jest.fn(),
//                 getRandomPreparedVideForAccountActivity: jest.fn(),
//                 runPublishingActivity: jest.fn(),
//                 getOrganizationsActivity: jest.fn(),
//             };

//             mockActivities.getAccountsActivity.mockResolvedValue({
//                 success: true,
//                 accounts: [],
//             });

//             const {workflowClient} = testEnv;
//             const handle = await workflowClient.start(publishingScheduleWorkflow, {
//                 args: [],
//                 taskQueue: 'test-queue',
//                 workflowId: 'test-workflow-4',
//             });

//             expect(handle.workflowId).toBe('test-workflow-4');
//             expect(handle.firstExecutionRunId).toBeDefined();
//         });
//     });

//     describe('Workflow Type Safety', () => {
//         it('should maintain type safety with new SDK', () => {
//             // This test verifies that the workflow functions are properly typed
//             // and can be imported without TypeScript errors
//             expect(typeof videoDownloadingWorkflow).toBe('function');
//             expect(typeof videoProcessingWorkflow).toBe('function');
//             expect(typeof videoPublishingWorkflow).toBe('function');
//             expect(typeof publishingScheduleWorkflow).toBe('function');
//         });
//     });
// });
