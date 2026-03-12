// /* eslint-disable @typescript-eslint/no-explicit-any */
// // Video Processing Workflow Integration Tests
// import {TestWorkflowEnvironment} from '@temporalio/testing';
// import {Runtime, Worker} from '@temporalio/worker';

// import {videoProcessingWorkflow} from '../video-processing.workflow';
// import { ProcessVideoActivityArgs, VideoDownloadingWorkflowArgs } from '#types';

// describe('Video Processing Workflow Integration Tests', () => {
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

//     describe('successful workflow scenarios', () => {
//         it('should complete full video processing workflow successfully', async () => {
//             const mockActivities = {
//                 downloadVideo: jest.fn<Promise<VideoDownloadingWorkflowArgs>, any[]>(),
//                 processVideo: jest.fn<Promise<ProcessVideoActivityArgs>, any[]>(),
//             };

//             // Setup successful mock responses
//             mockActivities.downloadVideo.mockResolvedValue({
//                 success: true,
//                 firebaseUrl: 'https://firebase.com/downloaded-video.mp4',
//                 duration: 30,
//             });

//             mockActivities.processVideo.mockResolvedValue({
//                 success: true,
//                 processedUrl: 'https://firebase.com/processed-video.mp4',
//                 duration: 45,
//                 outputPath: '/tmp/processed-video.mp4',
//             });

//             mockActivities.createInstagramContainer.mockResolvedValue({
//                 success: true,
//                 mediaContainerId: 'container_123',
//                 creationId: 'container_123',
//             });

//             mockActivities.publishInstagramPost.mockResolvedValue({
//                 success: true,
//                 postId: 'post_456',
//                 permalinkUrl: 'https://www.instagram.com/p/post_456/',
//             });

//             const {client, nativeConnection} = testEnv;
//             const worker = await Worker.create({
//                 connection: nativeConnection,
//                 taskQueue: 'test-video-processing',
//                 workflowsPath: require.resolve('../video-processing.workflow'),
//                 activities: mockActivities,
//             });

//             const input: VideoWorkflowInput = {
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//                 firebaseUrl: 'https://firebase.com/source-video.mp4',
//             };

//             const handle = await client.workflow.start(videoProcessingWorkflow, {
//                 args: [input],
//                 taskQueue: 'test-video-processing',
//                 workflowId: 'test-workflow-' + Math.random(),
//             });

//             // Run worker
//             const runPromise = worker.run();

//             const result = await handle.result();

//             // Shutdown worker
//             worker.shutdown();
//             await runPromise;

//             // Verify final result structure matches VideoWorkflowResult
//             expect(result.success).toBe(true);
//             expect(result.sourceId).toBe(123);
//             expect(result.accountId).toBe(456);
//             expect(result.scenarioId).toBe(789);
//             expect(result.downloadUrl).toBe('https://firebase.com/downloaded-video.mp4');
//             expect(result.processedUrl).toBe('https://firebase.com/processed-video.mp4');
//             expect(result.mediaContainerId).toBe('container_123');
//             expect(result.postId).toBe('post_456');
//             expect(result.permalinkUrl).toBe('https://www.instagram.com/p/post_456/');
//             expect(result.duration).toBe(45);

//             // Verify activity call sequence
//             expect(mockActivities.downloadVideo).toHaveBeenCalledWith({
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//                 firebaseUrl: 'https://firebase.com/source-video.mp4',
//             });

//             expect(mockActivities.processVideo).toHaveBeenCalledWith({
//                 firebaseUrl: 'https://firebase.com/downloaded-video.mp4',
//                 scenarioId: 789,
//                 accountId: 456,
//                 sourceId: 123,
//             });

//             expect(mockActivities.createInstagramContainer).toHaveBeenCalledWith({
//                 processedVideoUrl: 'https://firebase.com/processed-video.mp4',
//                 accountId: 456,
//                 scenarioId: 789,
//                 sourceId: 123,
//             });

//             expect(mockActivities.publishInstagramPost).toHaveBeenCalledWith({
//                 mediaContainerId: 'container_123',
//                 accountId: 456,
//                 creationId: 'container_123',
//             });
//         });

//         it('should handle provided firebaseUrl by skipping download', async () => {
//             const mockActivities = {
//                 downloadVideo: jest.fn<Promise<DownloadVideoResult>, any[]>(),
//                 processVideo: jest.fn<Promise<ProcessVideoResult>, any[]>(),
//                 createInstagramContainer: jest.fn<Promise<CreateInstagramContainerResult>, any[]>(),
//                 publishInstagramPost: jest.fn<Promise<PublishInstagramPostResult>, any[]>(),
//             };

//             mockActivities.downloadVideo.mockResolvedValue({
//                 success: true,
//                 firebaseUrl: 'https://firebase.com/provided-video.mp4',
//                 duration: undefined,
//             });

//             mockActivities.processVideo.mockResolvedValue({
//                 success: true,
//                 processedUrl: 'https://firebase.com/processed-video.mp4',
//                 duration: 60,
//                 outputPath: '/tmp/processed-video.mp4',
//             });

//             mockActivities.createInstagramContainer.mockResolvedValue({
//                 success: true,
//                 mediaContainerId: 'container_456',
//                 creationId: 'container_456',
//             });

//             mockActivities.publishInstagramPost.mockResolvedValue({
//                 success: true,
//                 postId: 'post_789',
//                 permalinkUrl: 'https://www.instagram.com/p/post_789/',
//             });

//             const {client, nativeConnection} = testEnv;
//             const worker = await Worker.create({
//                 connection: nativeConnection,
//                 taskQueue: 'test-video-processing',
//                 workflowsPath: require.resolve('../video-processing.workflow'),
//                 activities: mockActivities,
//             });

//             const inputWithFirebaseUrl: VideoWorkflowInput = {
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//                 firebaseUrl: 'https://firebase.com/provided-video.mp4',
//             };

//             const handle = await client.workflow.start(videoProcessingWorkflow, {
//                 args: [inputWithFirebaseUrl],
//                 taskQueue: 'test-video-processing',
//                 workflowId: 'test-workflow-with-url-' + Math.random(),
//             });

//             const runPromise = worker.run();
//             const result = await handle.result();
//             worker.shutdown();
//             await runPromise;

//             expect(result.success).toBe(true);

//             // Download should be called with provided URL
//             expect(mockActivities.downloadVideo).toHaveBeenCalledWith({
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//                 firebaseUrl: 'https://firebase.com/provided-video.mp4',
//             });
//         });
//     });

//     describe('error handling scenarios', () => {
//         it('should handle download failure', async () => {
//             const mockActivities = {
//                 downloadVideo: jest.fn<Promise<DownloadVideoResult>, any[]>(),
//                 processVideo: jest.fn<Promise<ProcessVideoResult>, any[]>(),
//                 createInstagramContainer: jest.fn<Promise<CreateInstagramContainerResult>, any[]>(),
//                 publishInstagramPost: jest.fn<Promise<PublishInstagramPostResult>, any[]>(),
//             };

//             mockActivities.downloadVideo.mockResolvedValue({
//                 success: false,
//                 error: 'Failed to download video from source',
//             });

//             const {client, nativeConnection} = testEnv;
//             const worker = await Worker.create({
//                 connection: nativeConnection,
//                 taskQueue: 'test-video-processing',
//                 workflowsPath: require.resolve('../video-processing.workflow'),
//                 activities: mockActivities,
//             });

//             const input: VideoWorkflowInput = {
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//             };

//             const handle = await client.workflow.start(videoProcessingWorkflow, {
//                 args: [input],
//                 taskQueue: 'test-video-processing',
//                 workflowId: 'test-workflow-download-fail-' + Math.random(),
//             });

//             const runPromise = worker.run();
//             const result = await handle.result();
//             worker.shutdown();
//             await runPromise;

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Failed to download video from source');
//             expect(result.step).toBe('download');

//             // Only download should be called
//             expect(mockActivities.downloadVideo).toHaveBeenCalled();
//             expect(mockActivities.processVideo).not.toHaveBeenCalled();
//             expect(mockActivities.createInstagramContainer).not.toHaveBeenCalled();
//             expect(mockActivities.publishInstagramPost).not.toHaveBeenCalled();
//         });

//         it('should handle process failure', async () => {
//             const mockActivities = {
//                 downloadVideo: jest.fn<Promise<DownloadVideoResult>, any[]>(),
//                 processVideo: jest.fn<Promise<ProcessVideoResult>, any[]>(),
//                 createInstagramContainer: jest.fn<Promise<CreateInstagramContainerResult>, any[]>(),
//                 publishInstagramPost: jest.fn<Promise<PublishInstagramPostResult>, any[]>(),
//             };

//             mockActivities.downloadVideo.mockResolvedValue({
//                 success: true,
//                 firebaseUrl: 'https://firebase.com/downloaded-video.mp4',
//                 duration: 30,
//             });

//             mockActivities.processVideo.mockResolvedValue({
//                 success: false,
//                 error: 'FFmpeg processing failed',
//             });

//             const {client, nativeConnection} = testEnv;
//             const worker = await Worker.create({
//                 connection: nativeConnection,
//                 taskQueue: 'test-video-processing',
//                 workflowsPath: require.resolve('../video-processing.workflow'),
//                 activities: mockActivities,
//             });

//             const input: VideoWorkflowInput = {
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//             };

//             const handle = await client.workflow.start(videoProcessingWorkflow, {
//                 args: [input],
//                 taskQueue: 'test-video-processing',
//                 workflowId: 'test-workflow-process-fail-' + Math.random(),
//             });

//             const runPromise = worker.run();
//             const result = await handle.result();
//             worker.shutdown();
//             await runPromise;

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('FFmpeg processing failed');
//             expect(result.step).toBe('process');
//             expect(result.downloadUrl).toBe('https://firebase.com/downloaded-video.mp4');

//             // Download and process should be called, but not container/publish
//             expect(mockActivities.downloadVideo).toHaveBeenCalled();
//             expect(mockActivities.processVideo).toHaveBeenCalled();
//             expect(mockActivities.createInstagramContainer).not.toHaveBeenCalled();
//             expect(mockActivities.publishInstagramPost).not.toHaveBeenCalled();
//         });

//         it('should handle container creation failure', async () => {
//             const mockActivities = {
//                 downloadVideo: jest.fn<Promise<DownloadVideoResult>, any[]>(),
//                 processVideo: jest.fn<Promise<ProcessVideoResult>, any[]>(),
//                 createInstagramContainer: jest.fn<Promise<CreateInstagramContainerResult>, any[]>(),
//                 publishInstagramPost: jest.fn<Promise<PublishInstagramPostResult>, any[]>(),
//             };

//             mockActivities.downloadVideo.mockResolvedValue({
//                 success: true,
//                 firebaseUrl: 'https://firebase.com/downloaded-video.mp4',
//                 duration: 30,
//             });

//             mockActivities.processVideo.mockResolvedValue({
//                 success: true,
//                 processedUrl: 'https://firebase.com/processed-video.mp4',
//                 duration: 45,
//                 outputPath: '/tmp/processed-video.mp4',
//             });

//             mockActivities.createInstagramContainer.mockResolvedValue({
//                 success: false,
//                 error: 'Instagram API rate limit exceeded',
//             });

//             const {client, nativeConnection} = testEnv;
//             const worker = await Worker.create({
//                 connection: nativeConnection,
//                 taskQueue: 'test-video-processing',
//                 workflowsPath: require.resolve('../video-processing.workflow'),
//                 activities: mockActivities,
//             });

//             const input: VideoWorkflowInput = {
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//             };

//             const handle = await client.workflow.start(videoProcessingWorkflow, {
//                 args: [input],
//                 taskQueue: 'test-video-processing',
//                 workflowId: 'test-workflow-container-fail-' + Math.random(),
//             });

//             const runPromise = worker.run();
//             const result = await handle.result();
//             worker.shutdown();
//             await runPromise;

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Instagram API rate limit exceeded');
//             expect(result.step).toBe('createContainer');
//             expect(result.downloadUrl).toBe('https://firebase.com/downloaded-video.mp4');
//             expect(result.processedUrl).toBe('https://firebase.com/processed-video.mp4');

//             // All except publish should be called
//             expect(mockActivities.downloadVideo).toHaveBeenCalled();
//             expect(mockActivities.processVideo).toHaveBeenCalled();
//             expect(mockActivities.createInstagramContainer).toHaveBeenCalled();
//             expect(mockActivities.publishInstagramPost).not.toHaveBeenCalled();
//         });

//         // it('should handle publish failure', async () => {
//         //     const mockActivities = {
//         //         downloadVideo: jest.fn<Promise<DownloadVideoResult>, any[]>(),
//         //         processVideo: jest.fn<Promise<ProcessVideoResult>, any[]>(),
//         //         createInstagramContainer: jest.fn<Promise<CreateInstagramContainerResult>, any[]>(),
//         //         publishInstagramPost: jest.fn<Promise<PublishInstagramPostResult>, any[]>(),
//         //     };

//         //     mockActivities.downloadVideo.mockResolvedValue({
//         //         success: true,
//         //         firebaseUrl: 'https://firebase.com/downloaded-video.mp4',
//         //         duration: 30,
//         //     });

//         //     mockActivities.processVideo.mockResolvedValue({
//         //         success: true,
//         //         processedUrl: 'https://firebase.com/processed-video.mp4',
//         //         duration: 45,
//         //         outputPath: '/tmp/processed-video.mp4',
//         //     });

//         //     mockActivities.createInstagramContainer.mockResolvedValue({
//         //         success: true,
//         //         mediaContainerId: 'container_123',
//         //         creationId: 'container_123',
//         //     });

//         //     mockActivities.publishInstagramPost.mockResolvedValue({
//         //         success: false,
//         //         error: 'Container not ready after 20 attempts',
//         //     });

//         //     const {client, nativeConnection} = testEnv;
//         //     const worker = await Worker.create({
//         //         connection: nativeConnection,
//         //         taskQueue: 'test-video-processing',
//         //         workflowsPath: require.resolve('../video-processing.workflow'),
//         //         activities: mockActivities,
//         //     });

//         //     const input: VideoWorkflowInput = {
//         //         sourceId: 123,
//         //         accountId: 456,
//         //         scenarioId: 789,
//         //     };

//         //     const handle = await client.workflow.start(videoProcessingWorkflow, {
//         //         args: [input],
//         //         taskQueue: 'test-video-processing',
//         //         workflowId: 'test-workflow-publish-fail-' + Math.random(),
//         //     });

//         //     const runPromise = worker.run();
//         //     const result = await handle.result();
//         //     worker.shutdown();
//         //     await runPromise;

//         //     expect(result.success).toBe(false);
//         //     expect(result.error).toContain('Container not ready after 20 attempts');
//         //     expect(result.step).toBe('publish');
//         //     expect(result.downloadUrl).toBe('https://firebase.com/downloaded-video.mp4');
//         //     expect(result.processedUrl).toBe('https://firebase.com/processed-video.mp4');
//         //     expect(result.mediaContainerId).toBe('container_123');

//         //     // All activities should be called
//         //     expect(mockActivities.downloadVideo).toHaveBeenCalled();
//         //     expect(mockActivities.processVideo).toHaveBeenCalled();
//         //     expect(mockActivities.createInstagramContainer).toHaveBeenCalled();
//         //     expect(mockActivities.publishInstagramPost).toHaveBeenCalled();
//         // });
//     });

//     describe('activity timeout and retry scenarios', () => {
//         it('should handle activity retries on failure', async () => {
//             const mockActivities = {
//                 downloadVideo: jest.fn<Promise<DownloadVideoResult>, any[]>(),
//                 processVideo: jest.fn<Promise<ProcessVideoResult>, any[]>(),
//                 createInstagramContainer: jest.fn<Promise<CreateInstagramContainerResult>, any[]>(),
//                 publishInstagramPost: jest.fn<Promise<PublishInstagramPostResult>, any[]>(),
//             };

//             // Mock download to fail twice, then succeed
//             mockActivities.downloadVideo
//                 .mockRejectedValueOnce(new Error('Network timeout'))
//                 .mockRejectedValueOnce(new Error('Network timeout'))
//                 .mockResolvedValue({
//                     success: true,
//                     firebaseUrl: 'https://firebase.com/downloaded-video.mp4',
//                     duration: 30,
//                 });

//             mockActivities.processVideo.mockResolvedValue({
//                 success: true,
//                 processedUrl: 'https://firebase.com/processed-video.mp4',
//                 duration: 45,
//                 outputPath: '/tmp/processed-video.mp4',
//             });

//             mockActivities.createInstagramContainer.mockResolvedValue({
//                 success: true,
//                 mediaContainerId: 'container_123',
//                 creationId: 'container_123',
//             });

//             mockActivities.publishInstagramPost.mockResolvedValue({
//                 success: true,
//                 postId: 'post_456',
//                 permalinkUrl: 'https://www.instagram.com/p/post_456/',
//             });

//             const {client, nativeConnection} = testEnv;
//             const worker = await Worker.create({
//                 connection: nativeConnection,
//                 taskQueue: 'test-video-processing',
//                 workflowsPath: require.resolve('../video-processing.workflow'),
//                 activities: mockActivities,
//             });

//             const input: VideoWorkflowInput = {
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//             };

//             const handle = await client.workflow.start(videoProcessingWorkflow, {
//                 args: [input],
//                 taskQueue: 'test-video-processing',
//                 workflowId: 'test-workflow-retry-' + Math.random(),
//             });

//             const runPromise = worker.run();
//             const result = await handle.result();
//             worker.shutdown();
//             await runPromise;

//             expect(result.success).toBe(true);
//             // Download should be called 3 times (2 failures + 1 success)
//             expect(mockActivities.downloadVideo).toHaveBeenCalledTimes(3);
//         });
//     });

//     describe('workflow structure validation', () => {
//         it('should return correct result structure for successful workflow', async () => {
//             const mockActivities = {
//                 downloadVideo: jest.fn<Promise<DownloadVideoResult>, any[]>(),
//                 processVideo: jest.fn<Promise<ProcessVideoResult>, any[]>(),
//                 createInstagramContainer: jest.fn<Promise<CreateInstagramContainerResult>, any[]>(),
//                 publishInstagramPost: jest.fn<Promise<PublishInstagramPostResult>, any[]>(),
//             };

//             mockActivities.downloadVideo.mockResolvedValue({
//                 success: true,
//                 firebaseUrl: 'https://firebase.com/video.mp4',
//                 duration: 30,
//             });

//             mockActivities.processVideo.mockResolvedValue({
//                 success: true,
//                 processedUrl: 'https://firebase.com/processed.mp4',
//                 duration: 45,
//                 outputPath: '/tmp/out.mp4',
//             });

//             mockActivities.createInstagramContainer.mockResolvedValue({
//                 success: true,
//                 mediaContainerId: 'container_789',
//                 creationId: 'container_789',
//             });

//             mockActivities.publishInstagramPost.mockResolvedValue({
//                 success: true,
//                 postId: 'post_111',
//                 permalinkUrl: 'https://www.instagram.com/p/post_111/',
//             });

//             const {client, nativeConnection} = testEnv;
//             const worker = await Worker.create({
//                 connection: nativeConnection,
//                 taskQueue: 'test-video-processing',
//                 workflowsPath: require.resolve('../video-processing.workflow'),
//                 activities: mockActivities,
//             });

//             const input: VideoWorkflowInput = {
//                 sourceId: 111,
//                 accountId: 222,
//                 scenarioId: 333,
//             };

//             const handle = await client.workflow.start(videoProcessingWorkflow, {
//                 args: [input],
//                 taskQueue: 'test-video-processing',
//                 workflowId: 'test-workflow-structure-' + Math.random(),
//             });

//             const runPromise = worker.run();
//             const result = await handle.result();
//             worker.shutdown();
//             await runPromise;

//             // Validate complete result structure matches VideoWorkflowResult
//             expect(result).toEqual({
//                 success: true,
//                 sourceId: 111,
//                 accountId: 222,
//                 scenarioId: 333,
//                 downloadUrl: 'https://firebase.com/video.mp4',
//                 processedUrl: 'https://firebase.com/processed.mp4',
//                 mediaContainerId: 'container_789',
//                 postId: 'post_111',
//                 permalinkUrl: 'https://www.instagram.com/p/post_111/',
//                 duration: 45,
//             });
//         });
//     });
// });
