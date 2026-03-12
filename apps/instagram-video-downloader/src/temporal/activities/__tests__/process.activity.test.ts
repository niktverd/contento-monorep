// // Process Video Activity Unit Tests
// import {rmSync} from 'fs';

// import {processVideo} from '../process.activity';

// import {getVideoDuration} from '#src/sections/cloud-run/components/video';
// import {ScenarioType} from '#src/types/enums';
// import {ProcessVideoInput} from '#src/types/temporal';
// import {getWorkingDirectoryForVideo, uploadFileToServer} from '#src/utils';
// import {fetchGet, fetchPost} from '#src/utils/fetchHelpers';
// import {log} from '#src/utils/logging';

// // Mock dependencies
// jest.mock('fs');
// jest.mock('#src/sections/cloud-run/components/scenarios/ScenarioMap', () => ({
//     ScenarioMap: {},
// }));
// jest.mock('#src/sections/cloud-run/components/video');
// jest.mock('#src/utils/fetchHelpers');
// jest.mock('#src/utils/logging');
// jest.mock('#src/utils', () => ({
//     ...jest.requireActual('#src/utils'),
//     getWorkingDirectoryForVideo: jest.fn(),
//     uploadFileToServer: jest.fn(),
// }));

// // Mock Temporal Context
// const mockHeartbeat = jest.fn();
// jest.mock('@temporalio/activity', () => ({
//     Context: {
//         current: () => ({
//             heartbeat: mockHeartbeat,
//         }),
//     },
// }));

// describe('processVideo Activity', () => {
//     const mockInput: ProcessVideoInput = {
//         firebaseUrl: 'https://firebase.com/video.mp4',
//         scenarioId: 123,
//         accountId: 456,
//         sourceId: 789,
//     };

//     const mockScenario = {
//         id: 123,
//         slug: 'test-scenario',
//         type: ScenarioType.ScenarioCoverWithGreenUnique,
//         enabled: true,
//         settings: {duration: 30},
//     };

//     const mockAccount = {
//         id: 456,
//         name: 'Test Account',
//         availableScenarios: [{...mockScenario}],
//     };

//     const mockSource = {
//         id: 789,
//         firebaseUrl: 'https://firebase.com/video.mp4',
//         duration: 30,
//     };

//     const mockScenarioFunction = jest.fn();
//     const mockScenarioSchema = {
//         safeParse: jest.fn(),
//     };

//     // Import ScenarioMap for mocking
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     let ScenarioMap: any;

//     beforeEach(async () => {
//         jest.clearAllMocks();

//         // Setup ScenarioMap mock
//         const scenarioMapModule = await import(
//             '#src/sections/cloud-run/components/scenarios/ScenarioMap'
//         );
//         ScenarioMap = scenarioMapModule.ScenarioMap;

//         // Clear and setup scenario map
//         Object.keys(ScenarioMap).forEach((key) => delete ScenarioMap[key]);
//         ScenarioMap[ScenarioType.ScenarioCoverWithGreenUnique] = {
//             scenario: mockScenarioFunction,
//             schema: mockScenarioSchema,
//         };

//         // Reset mocks to default values
//         mockScenarioSchema.safeParse.mockReturnValue({success: true});
//         mockScenarioFunction.mockResolvedValue('/tmp/processed-video.mp4');

//         // Setup other mocks but NOT fetchGet - let each test configure it
//         (getWorkingDirectoryForVideo as jest.Mock).mockReturnValue('/tmp/working-dir');
//         (getVideoDuration as jest.Mock).mockResolvedValue(45);
//         (uploadFileToServer as jest.Mock).mockResolvedValue(
//             'https://firebase.com/processed-video.mp4',
//         );
//         (fetchPost as jest.Mock).mockResolvedValue({id: 999});
//         (rmSync as jest.Mock).mockImplementation(() => {});
//     });

//     describe('successful processing scenarios', () => {
//         it('should successfully process video with valid scenario', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(true);
//             expect(result.processedUrl).toBe('https://firebase.com/processed-video.mp4');
//             expect(result.duration).toBe(45);
//             expect(result.outputPath).toBe('/tmp/processed-video.mp4');

//             // Verify sequence of calls
//             expect(fetchGet).toHaveBeenCalledTimes(3);
//             expect(mockScenarioFunction).toHaveBeenCalledWith({
//                 scenario: mockScenario,
//                 source: {
//                     ...mockSource,
//                     firebaseUrl: 'https://firebase.com/video.mp4',
//                 },
//                 basePath: '/tmp/working-dir',
//             });
//             expect(uploadFileToServer).toHaveBeenCalledWith(
//                 '/tmp/processed-video.mp4',
//                 expect.stringMatching(/temporal-456-123-789-\d+-test-scenario\.mp4/),
//             );
//             expect(fetchPost).toHaveBeenCalledWith({
//                 route: expect.any(String),
//                 body: {
//                     firebaseUrl: 'https://firebase.com/processed-video.mp4',
//                     scenarioId: 123,
//                     sourceId: 789,
//                     accountId: 456,
//                     duration: 45,
//                 },
//             });
//         });

//         it('should send heartbeats during processing operations', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             await processVideo(mockInput);

//             expect(mockHeartbeat).toHaveBeenCalledWith(
//                 'Fetching scenario, account, and source data',
//             );
//             expect(mockHeartbeat).toHaveBeenCalledWith(
//                 'Validating scenario permissions and settings',
//             );
//             expect(mockHeartbeat).toHaveBeenCalledWith(
//                 'Preparing working directory for video processing',
//             );
//             expect(mockHeartbeat).toHaveBeenCalledWith('Executing video processing scenario');
//             expect(mockHeartbeat).toHaveBeenCalledWith(
//                 'Calculating video duration and uploading result',
//             );
//             expect(mockHeartbeat).toHaveBeenCalledWith('Saving processed video to database');
//             expect(mockHeartbeat).toHaveBeenCalledWith('Cleaning up temporary files');
//         });

//         it('should clean up temporary files after processing', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             await processVideo(mockInput);

//             expect(rmSync).toHaveBeenCalledWith('/tmp/working-dir', {recursive: true});
//         });

//         it('should continue if cleanup fails', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             (rmSync as jest.Mock).mockImplementation(() => {
//                 throw new Error('Cleanup failed');
//             });

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(true);
//             expect(log).toHaveBeenCalledWith(
//                 'Warning: Failed to clean up temporary files',
//                 expect.objectContaining({
//                     basePath: '/tmp/working-dir',
//                     cleanupError: expect.any(Error),
//                 }),
//             );
//         });
//     });

//     describe('validation error scenarios', () => {
//         it('should handle scenario not found', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(null) // scenario not found
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Scenario with id 123 not found');
//         });

//         it('should handle account not found', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(null) // account not found
//                 .mockResolvedValueOnce(mockSource); // source

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Account with id 456 not found');
//         });

//         it('should handle source not found', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(null); // source not found

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Source with id 789 not found');
//         });

//         it('should handle scenario not available for account', async () => {
//             const accountWithoutScenario = {
//                 ...mockAccount,
//                 availableScenarios: [], // Empty scenarios
//             };
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(accountWithoutScenario) // account without scenario
//                 .mockResolvedValueOnce(mockSource); // source

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain(
//                 'Scenario with id 123 not available for account with id 456',
//             );
//         });

//         it('should handle disabled scenario', async () => {
//             const disabledScenario = {
//                 ...mockScenario,
//                 enabled: false, // Disabled scenario
//             };
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(disabledScenario) // disabled scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Scenario with id 123 is not enabled');
//         });

//         it('should handle missing scenario workflow', async () => {
//             // Save original scenario map
//             const originalScenario = ScenarioMap[ScenarioType.ScenarioCoverWithGreenUnique];
//             delete ScenarioMap[ScenarioType.ScenarioCoverWithGreenUnique];

//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain(
//                 'Scenario workflow not found for scenario type ScenarioCoverWithGreenUnique',
//             );

//             // Restore original scenario map
//             ScenarioMap[ScenarioType.ScenarioCoverWithGreenUnique] = originalScenario;
//         });

//         it('should handle invalid scenario configuration', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             mockScenarioSchema.safeParse.mockReturnValue({
//                 success: false,
//                 error: {message: 'Invalid config'},
//             });

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Scenario with id 123 has invalid configuration');
//         });

//         it('should handle missing scenario function', async () => {
//             // Save original scenario map
//             const originalScenario = ScenarioMap[ScenarioType.ScenarioCoverWithGreenUnique];
//             ScenarioMap[ScenarioType.ScenarioCoverWithGreenUnique] = {
//                 scenario: null, // No scenario function
//                 schema: mockScenarioSchema,
//             };

//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Scenario function not found for scenario with id 123');

//             // Restore original scenario map
//             ScenarioMap[ScenarioType.ScenarioCoverWithGreenUnique] = originalScenario;
//         });
//     });

//     describe('processing error scenarios', () => {
//         it('should handle scenario function execution error', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             mockScenarioFunction.mockRejectedValue(new Error('FFmpeg processing failed'));

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('FFmpeg processing failed');
//         });

//         it('should handle video duration calculation error', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             (getVideoDuration as jest.Mock).mockRejectedValue(new Error('Duration calc failed'));

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Duration calc failed');
//         });

//         it('should handle file upload error', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             (uploadFileToServer as jest.Mock).mockRejectedValue(new Error('Upload failed'));

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             expect(result.error).toContain('Upload failed');
//         });

//         it('should handle database save error', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             (fetchPost as jest.Mock).mockRejectedValue(new Error('Database save failed'));

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(false);
//             // expect(result.error).toContain('Database save failed');
//         });
//     });

//     describe('edge cases', () => {
//         it('should handle different scenario types', async () => {
//             const shortifyScenario = {
//                 ...mockScenario,
//                 type: ScenarioType.ScenarioShortifyUnique,
//                 slug: 'shortify-unique',
//             };

//             ScenarioMap[ScenarioType.ScenarioShortifyUnique] = {
//                 scenario: mockScenarioFunction,
//                 schema: mockScenarioSchema,
//             };

//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(shortifyScenario)
//                 .mockResolvedValueOnce({
//                     ...mockAccount,
//                     availableScenarios: [shortifyScenario],
//                 })
//                 .mockResolvedValueOnce(mockSource);

//             const result = await processVideo(mockInput);

//             expect(result.success).toBe(true);
//             expect(uploadFileToServer).toHaveBeenCalledWith(
//                 '/tmp/processed-video.mp4',
//                 expect.stringMatching(/temporal-456-123-789-\d+-shortify-unique\.mp4/),
//             );
//         });

//         it('should generate unique working directory name', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             await processVideo(mockInput);

//             expect(getWorkingDirectoryForVideo).toHaveBeenCalledWith(
//                 expect.stringMatching(/^temporal-456-123-789-\d+$/),
//             );
//         });

//         it('should use original source firebaseUrl in scenario function', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             await processVideo(mockInput);

//             expect(mockScenarioFunction).toHaveBeenCalledWith({
//                 scenario: mockScenario,
//                 source: {
//                     ...mockSource,
//                     firebaseUrl: 'https://firebase.com/video.mp4', // From input, not source
//                 },
//                 basePath: '/tmp/working-dir',
//             });
//         });
//     });

//     describe('logging verification', () => {
//         it('should log key processing steps', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             await processVideo(mockInput);

//             expect(log).toHaveBeenCalledWith('Starting processVideo activity', {
//                 firebaseUrl: 'https://firebase.com/video.mp4',
//                 scenarioId: 123,
//                 accountId: 456,
//                 sourceId: 789,
//             });

//             expect(log).toHaveBeenCalledWith('Data fetched successfully', {
//                 scenarioSlug: 'test-scenario',
//                 accountId: 456,
//                 sourceId: 789,
//             });

//             expect(log).toHaveBeenCalledWith('Video processing completed successfully', {
//                 processedUrl: 'https://firebase.com/processed-video.mp4',
//                 duration: 45,
//                 uploadFileName: expect.stringMatching(
//                     /temporal-456-123-789-\d+-test-scenario\.mp4/,
//                 ),
//             });
//         });

//         it('should log errors appropriately', async () => {
//             (fetchGet as jest.Mock)
//                 .mockResolvedValueOnce(mockScenario) // scenario
//                 .mockResolvedValueOnce(mockAccount) // account
//                 .mockResolvedValueOnce(mockSource); // source

//             mockScenarioFunction.mockRejectedValue(new Error('Test error'));

//             await processVideo(mockInput);

//             expect(log).toHaveBeenCalledWith('Error in processVideo activity', {
//                 error: expect.any(Object),
//                 scenarioId: 123,
//                 accountId: 456,
//                 sourceId: 789,
//             });
//         });
//     });
// });
