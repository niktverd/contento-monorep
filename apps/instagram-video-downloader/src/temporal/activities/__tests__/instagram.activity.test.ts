// // Instagram Activities Unit Tests
// import {createInstagramContainer, publishInstagramPost} from '../instagram.activity';

// import {
//     canInstagramPostBePublished,
//     createInstagramPostContainer,
//     publishInstagramPostContainer,
// } from '#src/sections/instagram/components/instagram';
// import {InstagramLocationSource} from '#src/types';
// import {CreateInstagramContainerInput, PublishInstagramPostInput} from '#src/types/temporal';
// import {delay, getRandomElementOfArray, prepareCaption} from '#src/utils';
// import {fetchGet} from '#src/utils/fetchHelpers';
// import {log} from '#src/utils/logging';

// // Mock dependencies
// jest.mock('#src/sections/instagram/components/instagram');
// jest.mock('#src/utils/fetchHelpers');
// jest.mock('#src/utils/logging');
// jest.mock('#src/utils', () => ({
//     ...jest.requireActual('#src/utils'),
//     delay: jest.fn(),
//     getRandomElementOfArray: jest.fn(),
//     prepareCaption: jest.fn(),
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

// describe('Instagram Activities', () => {
//     describe('createInstagramContainer', () => {
//         const mockInput: CreateInstagramContainerInput = {
//             processedVideoUrl: 'https://firebase.com/processed-video.mp4',
//             accountId: 456,
//             scenarioId: 123,
//             sourceId: 789,
//         };

//         const mockAccount = {
//             id: 456,
//             name: 'Test Account',
//             token: 'test-access-token',
//             instagramLocations: [
//                 {id: 1, name: 'New York', externalId: 'ny123'},
//                 {id: 2, name: 'Los Angeles', externalId: 'la456'},
//             ],
//         };

//         const mockScenario = {
//             id: 123,
//             slug: 'test-scenario',
//             texts: ['Test caption #hashtag'],
//             instagramLocationSource: InstagramLocationSource.Account,
//             instagramLocations: [{id: 3, name: 'Paris', externalId: 'paris789'}],
//         };

//         beforeEach(() => {
//             jest.clearAllMocks();

//             // Setup default mocks but NOT fetchGet - let each test configure it
//             (prepareCaption as jest.Mock).mockReturnValue('Test caption #hashtag');
//             (getRandomElementOfArray as jest.Mock).mockReturnValue(
//                 mockAccount.instagramLocations[0],
//             );
//             (createInstagramPostContainer as jest.Mock).mockResolvedValue({
//                 success: true,
//                 mediaContainerId: 'container_123',
//             });
//         });

//         describe('successful container creation', () => {
//             it('should successfully create Instagram container', async () => {
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(mockAccount) // account
//                     .mockResolvedValueOnce(mockScenario); // scenario

//                 const result = await createInstagramContainer(mockInput);

//                 expect(result.success).toBe(true);
//                 expect(result.mediaContainerId).toBe('container_123');
//                 expect(result.creationId).toBe('container_123');

//                 // Verify sequence of calls
//                 expect(fetchGet).toHaveBeenCalledTimes(2);
//                 expect(prepareCaption).toHaveBeenCalledWith(['Test caption #hashtag']);
//                 expect(createInstagramPostContainer).toHaveBeenCalledWith({
//                     caption: 'Test caption #hashtag',
//                     videoUrl: 'https://firebase.com/processed-video.mp4',
//                     locationId: 'ny123',
//                     accessToken: 'test-access-token',
//                 });
//             });

//             it('should use scenario locations when configured', async () => {
//                 const scenarioWithOwnLocations = {
//                     ...mockScenario,
//                     instagramLocationSource: InstagramLocationSource.Scenario,
//                 };
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(mockAccount)
//                     .mockResolvedValueOnce(scenarioWithOwnLocations);

//                 (getRandomElementOfArray as jest.Mock).mockReturnValue(
//                     scenarioWithOwnLocations.instagramLocations[0],
//                 );

//                 await createInstagramContainer(mockInput);

//                 expect(getRandomElementOfArray).toHaveBeenCalledWith([
//                     {id: 3, name: 'Paris', externalId: 'paris789'},
//                 ]);
//                 expect(createInstagramPostContainer).toHaveBeenCalledWith(
//                     expect.objectContaining({
//                         locationId: 'paris789',
//                     }),
//                 );
//             });

//             it('should handle missing locations gracefully', async () => {
//                 const accountWithoutLocations = {
//                     ...mockAccount,
//                     instagramLocations: [],
//                 };
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(accountWithoutLocations)
//                     .mockResolvedValueOnce(mockScenario);

//                 (getRandomElementOfArray as jest.Mock).mockReturnValue(undefined);

//                 const result = await createInstagramContainer(mockInput);

//                 expect(result.success).toBe(true);
//                 expect(createInstagramPostContainer).toHaveBeenCalledWith(
//                     expect.objectContaining({
//                         locationId: undefined,
//                     }),
//                 );
//             });

//             it('should send heartbeats during operations', async () => {
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(mockAccount) // account
//                     .mockResolvedValueOnce(mockScenario); // scenario

//                 await createInstagramContainer(mockInput);

//                 expect(mockHeartbeat).toHaveBeenCalledWith('Fetching account and scenario data');
//                 expect(mockHeartbeat).toHaveBeenCalledWith('Preparing Instagram post data');
//                 expect(mockHeartbeat).toHaveBeenCalledWith('Creating Instagram media container');
//                 expect(mockHeartbeat).toHaveBeenCalledWith('Saving container to database');
//             });
//         });

//         describe('error handling scenarios', () => {
//             it('should handle account not found', async () => {
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(null) // account not found
//                     .mockResolvedValueOnce(mockScenario); // scenario

//                 const result = await createInstagramContainer(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain('Account with id 456 not found');
//             });

//             it('should handle scenario not found', async () => {
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(mockAccount) // account
//                     .mockResolvedValueOnce(null); // scenario not found

//                 const result = await createInstagramContainer(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain('Scenario with id 123 not found');
//             });

//             it('should handle missing access token', async () => {
//                 const accountWithoutToken = {
//                     ...mockAccount,
//                     token: null,
//                 };
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(accountWithoutToken) // account without token
//                     .mockResolvedValueOnce(mockScenario); // scenario

//                 const result = await createInstagramContainer(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain('Account with id 456 has no access token');
//             });

//             it('should handle Instagram API container creation failure', async () => {
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(mockAccount) // account
//                     .mockResolvedValueOnce(mockScenario); // scenario

//                 (createInstagramPostContainer as jest.Mock).mockResolvedValue({
//                     success: false,
//                     error: 'Instagram API error',
//                 });

//                 const result = await createInstagramContainer(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain(
//                     'Failed to create Instagram container: Instagram API error',
//                 );
//             });

//             it('should handle Instagram API container creation without container ID', async () => {
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(mockAccount) // account
//                     .mockResolvedValueOnce(mockScenario); // scenario

//                 (createInstagramPostContainer as jest.Mock).mockResolvedValue({
//                     success: true,
//                     mediaContainerId: null,
//                 });

//                 const result = await createInstagramContainer(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain(
//                     'Failed to create Instagram container: Unknown error',
//                 );
//             });
//         });

//         describe('logging verification', () => {
//             it('should log key operations', async () => {
//                 (fetchGet as jest.Mock)
//                     .mockResolvedValueOnce(mockAccount) // account
//                     .mockResolvedValueOnce(mockScenario); // scenario

//                 await createInstagramContainer(mockInput);

//                 expect(log).toHaveBeenCalledWith('Starting createInstagramContainer activity', {
//                     processedVideoUrl: 'https://firebase.com/processed-video.mp4',
//                     accountId: 456,
//                     scenarioId: 123,
//                     sourceId: 789,
//                 });

//                 expect(log).toHaveBeenCalledWith('Account and scenario fetched successfully', {
//                     accountId: 456,
//                     scenarioSlug: 'test-scenario',
//                 });

//                 expect(log).toHaveBeenCalledWith('Instagram container created successfully', {
//                     mediaContainerId: 'container_123',
//                 });
//             });
//         });
//     });

//     describe('publishInstagramPost', () => {
//         const mockInput: PublishInstagramPostInput = {
//             mediaContainerId: 'container_123',
//             accountId: 456,
//             creationId: 'container_123',
//         };

//         const mockAccount = {
//             id: 456,
//             name: 'Test Account',
//             token: 'test-access-token',
//         };

//         beforeEach(() => {
//             jest.clearAllMocks();

//             // Setup default mocks but NOT fetchGet - let each test configure it
//             (canInstagramPostBePublished as jest.Mock).mockResolvedValue(true);
//             (publishInstagramPostContainer as jest.Mock).mockResolvedValue({
//                 success: true,
//                 postId: 'post_456',
//             });
//             (delay as jest.Mock).mockResolvedValue(undefined);
//         });

//         describe('successful publishing scenarios', () => {
//             it('should successfully publish Instagram post when container is ready', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);

//                 const result = await publishInstagramPost(mockInput);

//                 expect(result.success).toBe(true);
//                 expect(result.postId).toBe('post_456');
//                 expect(result.permalinkUrl).toBe('https://www.instagram.com/p/post_456/');

//                 // Verify sequence of calls
//                 expect(fetchGet).toHaveBeenCalledWith({
//                     route: expect.any(String),
//                     query: {id: 456},
//                 });
//                 expect(canInstagramPostBePublished).toHaveBeenCalledWith({
//                     mediaContainerId: 'container_123',
//                     accessToken: 'test-access-token',
//                 });
//                 expect(publishInstagramPostContainer).toHaveBeenCalledWith({
//                     containerId: 'container_123',
//                     accessToken: 'test-access-token',
//                 });
//             });

//             it('should use creationId when provided instead of mediaContainerId', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);

//                 const inputWithCreationId = {
//                     ...mockInput,
//                     creationId: 'creation_789',
//                 };

//                 await publishInstagramPost(inputWithCreationId);

//                 expect(canInstagramPostBePublished).toHaveBeenCalledWith({
//                     mediaContainerId: 'creation_789',
//                     accessToken: 'test-access-token',
//                 });
//                 expect(publishInstagramPostContainer).toHaveBeenCalledWith({
//                     containerId: 'creation_789',
//                     accessToken: 'test-access-token',
//                 });
//             });

//             it('should poll for container readiness with retries', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);

//                 // Mock readiness check to fail first few times, then succeed
//                 (canInstagramPostBePublished as jest.Mock)
//                     .mockResolvedValueOnce(false)
//                     .mockResolvedValueOnce(false)
//                     .mockResolvedValueOnce(true);

//                 const result = await publishInstagramPost(mockInput);

//                 expect(result.success).toBe(true);
//                 expect(canInstagramPostBePublished).toHaveBeenCalledTimes(3);
//                 expect(delay).toHaveBeenCalledTimes(2);
//                 expect(delay).toHaveBeenCalledWith(30000); // 30 seconds
//             });

//             it('should send heartbeats during polling', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);

//                 (canInstagramPostBePublished as jest.Mock)
//                     .mockResolvedValueOnce(false)
//                     .mockResolvedValueOnce(true);

//                 await publishInstagramPost(mockInput);

//                 expect(mockHeartbeat).toHaveBeenCalledWith('Fetching account data');
//                 expect(mockHeartbeat).toHaveBeenCalledWith('Checking container readiness');
//                 expect(mockHeartbeat).toHaveBeenCalledWith('Checking readiness: attempt 1/20');
//                 expect(mockHeartbeat).toHaveBeenCalledWith('Checking readiness: attempt 2/20');
//                 expect(mockHeartbeat).toHaveBeenCalledWith('Publishing Instagram post');
//             });
//         });

//         describe('error handling scenarios', () => {
//             it('should handle account not found', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(null); // account not found

//                 const result = await publishInstagramPost(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain('Account with id 456 not found');
//             });

//             it('should handle missing access token', async () => {
//                 const accountWithoutToken = {
//                     ...mockAccount,
//                     token: null,
//                 };
//                 (fetchGet as jest.Mock).mockResolvedValue(accountWithoutToken);

//                 const result = await publishInstagramPost(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain('Account with id 456 has no access token');
//             });

//             it('should handle container not ready after max retries', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);
//                 (canInstagramPostBePublished as jest.Mock).mockResolvedValue(false); // Always not ready

//                 const result = await publishInstagramPost(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain(
//                     'Container container_123 was not ready after 20 attempts',
//                 );
//                 expect(canInstagramPostBePublished).toHaveBeenCalledTimes(20);
//             });

//             it('should handle Instagram publish API failure', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);
//                 (canInstagramPostBePublished as jest.Mock).mockResolvedValue(true);
//                 (publishInstagramPostContainer as jest.Mock).mockResolvedValue({
//                     success: false,
//                     error: 'Publish failed',
//                 });

//                 const result = await publishInstagramPost(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain('Publish failed');
//             });

//             it('should handle readiness check API errors', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);
//                 (canInstagramPostBePublished as jest.Mock).mockRejectedValue(
//                     new Error('API timeout'),
//                 );

//                 const result = await publishInstagramPost(mockInput);

//                 expect(result.success).toBe(false);
//                 expect(result.error).toContain('API timeout');
//             });
//         });

//         describe('edge cases', () => {
//             it('should handle missing creationId by using mediaContainerId', async () => {
//                 const inputWithoutCreationId = {
//                     mediaContainerId: 'container_999',
//                     accountId: 456,
//                 };

//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);

//                 await publishInstagramPost(inputWithoutCreationId);

//                 expect(canInstagramPostBePublished).toHaveBeenCalledWith({
//                     mediaContainerId: 'container_999',
//                     accessToken: 'test-access-token',
//                 });
//             });

//             it('should generate correct Instagram permalink URL', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);

//                 const result = await publishInstagramPost(mockInput);

//                 expect(result.permalinkUrl).toBe('https://www.instagram.com/p/post_456/');
//             });
//         });

//         describe('logging verification', () => {
//             it('should log key publishing steps', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);

//                 await publishInstagramPost(mockInput);

//                 expect(log).toHaveBeenCalledWith('Starting publishInstagramPost activity', {
//                     containerId: 'container_123',
//                     accountId: 456,
//                 });

//                 expect(log).toHaveBeenCalledWith('Account fetched successfully', {
//                     accountId: 456,
//                 });

//                 expect(log).toHaveBeenCalledWith('Instagram post published successfully', {
//                     postId: 'post_456',
//                     containerId: 'container_123',
//                 });
//             });

//             it('should log polling attempts', async () => {
//                 (fetchGet as jest.Mock).mockResolvedValue(mockAccount);

//                 (canInstagramPostBePublished as jest.Mock)
//                     .mockResolvedValueOnce(false)
//                     .mockResolvedValueOnce(true);

//                 await publishInstagramPost(mockInput);

//                 expect(log).toHaveBeenCalledWith('Checking if container is ready (attempt 1/20)');
//                 expect(log).toHaveBeenCalledWith('Container is ready to publish on attempt 2');
//             });
//         });
//     });
// });
