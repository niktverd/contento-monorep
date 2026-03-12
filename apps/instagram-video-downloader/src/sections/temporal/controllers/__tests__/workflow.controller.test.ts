// // Workflow Controller API Integration Tests
// import {
//     getTemporalClient,
//     getWorkflowResult,
//     getWorkflowStatus,
//     startVideoWorkflow,
// } from '../../client';
// import {
//     getWorkflowResultHandler,
//     getWorkflowStatusHandler,
//     startVideoWorkflowHandler,
//     temporalHealthHandler,
// } from '../../components/workflow.component';

// import {
//     GetWorkflowResultParams,
//     GetWorkflowStatusParams,
//     StartVideoWorkflowParams,
//     TemporalHealthParams,
// } from '#src/types/temporal';

// // Mock dependencies
// jest.mock('../../clients/client');
// jest.mock('#src/utils/logging');

// describe('Workflow Controller API Integration Tests', () => {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const mockDb = {} as any;

//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('startVideoWorkflowHandler', () => {
//         const validParams: StartVideoWorkflowParams = {
//             sourceId: 123,
//             accountId: 456,
//             scenarioId: 789,
//             firebaseUrl: 'https://firebase.com/video.mp4',
//         };

//         it('should successfully start a video workflow', async () => {
//             const mockWorkflowResult = {
//                 workflowId: 'test-workflow-123',
//                 runId: 'run-456',
//             };

//             (startVideoWorkflow as jest.Mock).mockResolvedValue(mockWorkflowResult);

//             const result = await startVideoWorkflowHandler(validParams, mockDb);

//             expect(result.result.success).toBe(true);
//             expect(result.result.workflowId).toBe('test-workflow-123');
//             expect(result.result.runId).toBe('run-456');
//             expect(result.code).toBe(200);

//             expect(startVideoWorkflow).toHaveBeenCalledWith({
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//                 firebaseUrl: 'https://firebase.com/video.mp4',
//             });
//         });

//         it('should handle workflow start failure', async () => {
//             const error = new Error('Temporal server unavailable');
//             (startVideoWorkflow as jest.Mock).mockRejectedValue(error);

//             const result = await startVideoWorkflowHandler(validParams, mockDb);

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Failed to start workflow');
//             expect(result.result.details).toBe('Temporal server unavailable');
//             expect(result.code).toBe(500);
//         });

//         it('should handle Temporal client connection failure', async () => {
//             const connectionError = new Error('connect ECONNREFUSED');
//             (startVideoWorkflow as jest.Mock).mockRejectedValue(connectionError);

//             const result = await startVideoWorkflowHandler(validParams, mockDb);

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Temporal Server unavailable');
//             expect(result.result.details).toBe(
//                 'Unable to connect to Temporal Server. Please try again later.',
//             );
//             expect(result.code).toBe(503);
//         });

//         it('should handle optional firebaseUrl parameter', async () => {
//             const paramsWithoutUrl = {
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//             };

//             const mockWorkflowResult = {
//                 workflowId: 'test-workflow-123',
//                 runId: 'run-456',
//             };

//             (startVideoWorkflow as jest.Mock).mockResolvedValue(mockWorkflowResult);

//             const result = await startVideoWorkflowHandler(paramsWithoutUrl, mockDb);

//             expect(result.result.success).toBe(true);
//             expect(startVideoWorkflow).toHaveBeenCalledWith(paramsWithoutUrl);
//         });

//         it('should handle unknown errors gracefully', async () => {
//             const unknownError = 'String error instead of Error object';
//             (startVideoWorkflow as jest.Mock).mockRejectedValue(unknownError);

//             const result = await startVideoWorkflowHandler(validParams, mockDb);

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Failed to start workflow');
//             expect(result.result.details).toBe('Unknown error occurred');
//             expect(result.code).toBe(500);
//         });
//     });

//     describe('getWorkflowStatusHandler', () => {
//         const validParams: GetWorkflowStatusParams = {
//             workflowId: 'test-workflow-123',
//         };

//         it('should successfully get workflow status', async () => {
//             const mockStatus = {
//                 status: 'RUNNING',
//                 runId: 'run-456',
//                 startTime: new Date('2024-01-01T10:00:00Z'),
//             };

//             (getWorkflowStatus as jest.Mock).mockResolvedValue(mockStatus);

//             const result = await getWorkflowStatusHandler(validParams, mockDb);

//             expect(result.result.success).toBe(true);
//             expect(result.result.workflowId).toBe('test-workflow-123');
//             expect(result.result.status).toBe('RUNNING');
//             expect(result.result.runId).toBe('run-456');
//             expect(result.result.startTime).toBe('2024-01-01T10:00:00.000Z');
//             expect(result.code).toBe(200);

//             expect(getWorkflowStatus).toHaveBeenCalledWith('test-workflow-123');
//         });

//         it('should handle workflow not found', async () => {
//             const error = new Error('Workflow not found');
//             (getWorkflowStatus as jest.Mock).mockRejectedValue(error);

//             const result = await getWorkflowStatusHandler(validParams, mockDb);

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Workflow not found');
//             expect(result.result.details).toBe('Workflow with ID test-workflow-123 does not exist');
//             expect(result.code).toBe(404);
//         });

//         it('should handle generic errors', async () => {
//             const error = new Error('Client connection failed');
//             (getWorkflowStatus as jest.Mock).mockRejectedValue(error);

//             const result = await getWorkflowStatusHandler(validParams, mockDb);

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Failed to get workflow status');
//             expect(result.result.details).toBe('Client connection failed');
//             expect(result.code).toBe(500);
//         });

//         it('should handle different workflow statuses', async () => {
//             const completedStatus = {
//                 status: 'COMPLETED',
//                 runId: 'run-789',
//                 startTime: new Date('2024-01-01T10:00:00Z'),
//             };

//             (getWorkflowStatus as jest.Mock).mockResolvedValue(completedStatus);

//             const result = await getWorkflowStatusHandler(validParams, mockDb);

//             expect(result.result.success).toBe(true);
//             expect(result.result.status).toBe('COMPLETED');
//             expect(result.result.runId).toBe('run-789');
//         });
//     });

//     describe('getWorkflowResultHandler', () => {
//         const validParams: GetWorkflowResultParams = {
//             workflowId: 'test-workflow-123',
//         };

//         it('should successfully get workflow result for completed workflow', async () => {
//             const mockResult = {
//                 success: true,
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//                 downloadUrl: 'https://firebase.com/video.mp4',
//                 processedUrl: 'https://firebase.com/processed.mp4',
//                 postId: 'post_123',
//                 permalinkUrl: 'https://www.instagram.com/p/post_123/',
//             };

//             (getWorkflowResult as jest.Mock).mockResolvedValue(mockResult);

//             const result = await getWorkflowResultHandler(validParams, mockDb);

//             expect(result.result.success).toBe(true);
//             expect(result.result.workflowId).toBe('test-workflow-123');
//             expect(result.result.result).toEqual(mockResult);
//             expect(result.code).toBe(200);

//             expect(getWorkflowResult).toHaveBeenCalledWith('test-workflow-123');
//         });

//         it('should handle workflow result for failed workflow', async () => {
//             const mockFailedResult = {
//                 success: false,
//                 step: 'process',
//                 error: 'FFmpeg processing failed',
//                 sourceId: 123,
//                 accountId: 456,
//                 scenarioId: 789,
//             };

//             (getWorkflowResult as jest.Mock).mockResolvedValue(mockFailedResult);

//             const result = await getWorkflowResultHandler(validParams, mockDb);

//             expect(result.result.success).toBe(true); // API call successful
//             expect(result.result.result).toEqual(mockFailedResult);
//             expect(result.result.result.success).toBe(false); // Workflow failed
//             expect(result.code).toBe(200);
//         });

//         it('should handle workflow not found', async () => {
//             const error = new Error('Workflow execution not found');
//             (getWorkflowResult as jest.Mock).mockRejectedValue(error);

//             const result = await getWorkflowResultHandler(validParams, mockDb);

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Workflow not found');
//             expect(result.result.details).toBe('Workflow with ID test-workflow-123 does not exist');
//             expect(result.code).toBe(404);
//         });

//         it('should handle generic errors', async () => {
//             const error = new Error('Connection refused');
//             (getWorkflowResult as jest.Mock).mockRejectedValue(error);

//             const result = await getWorkflowResultHandler(validParams, mockDb);

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Failed to get workflow result');
//             expect(result.result.details).toBe('Connection refused');
//             expect(result.code).toBe(500);
//         });
//     });

//     describe('temporalHealthHandler', () => {
//         const validParams: TemporalHealthParams = {};

//         it('should return healthy status when Temporal is accessible', async () => {
//             (getTemporalClient as jest.Mock).mockResolvedValue({});

//             const result = await temporalHealthHandler(validParams, mockDb);

//             expect(result.result.success).toBe(true);
//             expect(result.result.message).toBe('Temporal integration healthy');
//             expect(result.result.timestamp).toBeDefined();
//             expect(result.code).toBe(200);

//             expect(getTemporalClient).toHaveBeenCalled();
//         });

//         it('should return unhealthy status when Temporal is not accessible', async () => {
//             (getTemporalClient as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

//             const result = await temporalHealthHandler(validParams, mockDb);

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Temporal integration unhealthy');
//             expect(result.result.details).toBe('Connection timeout');
//             expect(result.result.timestamp).toBeDefined();
//             expect(result.code).toBe(503);
//         });

//         it('should include timestamp in health check response', async () => {
//             (getTemporalClient as jest.Mock).mockResolvedValue({});

//             const beforeTime = new Date().toISOString();
//             const result = await temporalHealthHandler(validParams, mockDb);
//             const afterTime = new Date().toISOString();

//             expect(result.result.timestamp).toBeDefined();
//             // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//             expect(result.result.timestamp! >= beforeTime).toBe(true);
//             // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//             expect(result.result.timestamp! <= afterTime).toBe(true);
//         });

//         it('should handle unknown errors gracefully', async () => {
//             const unknownError = 'String error instead of Error object';
//             (getTemporalClient as jest.Mock).mockRejectedValue(unknownError);

//             const result = await temporalHealthHandler(validParams, mockDb);

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Temporal integration unhealthy');
//             expect(result.result.details).toBe('Unknown error');
//             expect(result.code).toBe(503);
//         });
//     });

//     describe('error handling edge cases', () => {
//         it('should handle error objects without message property', async () => {
//             const weirdError = {toString: () => 'Custom error string'};
//             (startVideoWorkflow as jest.Mock).mockRejectedValue(weirdError);

//             const result = await startVideoWorkflowHandler(
//                 {sourceId: 123, accountId: 456, scenarioId: 789},
//                 mockDb,
//             );

//             expect(result.result.success).toBe(false);
//             expect(result.result.error).toBe('Failed to start workflow');
//             expect(result.result.details).toBe('Unknown error occurred');
//         });

//         it('should identify connection errors correctly', async () => {
//             const connectionErrors = [
//                 new Error('connect ECONNREFUSED 127.0.0.1:7233'),
//                 new Error('connection timeout'),
//                 new Error('failed to connect to temporal'),
//             ];

//             for (const error of connectionErrors) {
//                 (startVideoWorkflow as jest.Mock).mockRejectedValue(error);

//                 const result = await startVideoWorkflowHandler(
//                     {sourceId: 123, accountId: 456, scenarioId: 789},
//                     mockDb,
//                 );

//                 expect(result.result.error).toBe('Temporal Server unavailable');
//                 expect(result.code).toBe(503);
//             }
//         });

//         it('should identify not found errors correctly', async () => {
//             const notFoundErrors = [
//                 new Error('Workflow not found'),
//                 new Error('workflow execution not found'),
//                 new Error('resource not found'),
//             ];

//             for (const error of notFoundErrors) {
//                 (getWorkflowStatus as jest.Mock).mockRejectedValue(error);

//                 const result = await getWorkflowStatusHandler({workflowId: 'test-123'}, mockDb);

//                 expect(result.result.error).toBe('Workflow not found');
//                 expect(result.code).toBe(404);
//             }
//         });
//     });
// });
