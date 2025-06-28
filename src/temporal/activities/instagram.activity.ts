// // Instagram Activities for Temporal Workflow
// import {Context} from '@temporalio/activity';

// import {
//     canInstagramPostBePublished,
//     createInstagramPostContainer,
//     publishInstagramPostContainer,
// } from '#src/sections/instagram/components/instagram';
// import {InstagramLocationSource} from '#src/types';
// import {IAccount} from '#src/types/account';
// import {IScenario} from '#src/types/scenario';
// import {
//     CreateInstagramContainerInput,
//     CreateInstagramContainerResult,
//     PublishInstagramPostInput,
//     PublishInstagramPostResult,
// } from '#src/types/temporal';
// import {FetchRoutes, delay, getRandomElementOfArray, prepareCaption} from '#src/utils';
// import {ThrownError} from '#src/utils/error';
// import {fetchGet} from '#src/utils/fetchHelpers';
// import {log} from '#src/utils/logging';

// // eslint-disable-next-line valid-jsdoc
// /**
//  * Create Instagram container activity - creates a media container using Instagram Graph API
//  * Based on prepareMediaContainersForAccount logic
//  */
// export async function createInstagramContainer(
//     input: CreateInstagramContainerInput,
// ): Promise<CreateInstagramContainerResult> {
//     const {processedVideoUrl, accountId, scenarioId, sourceId} = input;

//     try {
//         log('Starting createInstagramContainer activity', {
//             processedVideoUrl,
//             accountId,
//             scenarioId,
//             sourceId,
//         });

//         Context.current().heartbeat('Fetching account and scenario data');

//         // Fetch account and scenario data
//         const [account, scenario] = await Promise.all([
//             fetchGet<IAccount>({
//                 route: FetchRoutes.getAccountById,
//                 query: {id: accountId},
//             }),
//             fetchGet<IScenario>({
//                 route: FetchRoutes.getScenario,
//                 query: {id: scenarioId},
//             }),
//         ]);

//         if (!account) {
//             throw new ThrownError(`Account with id ${accountId} not found`, 404);
//         }

//         if (!scenario) {
//             throw new ThrownError(`Scenario with id ${scenarioId} not found`, 404);
//         }

//         if (!account.token) {
//             throw new ThrownError(`Account with id ${accountId} has no access token`, 400);
//         }

//         log('Account and scenario fetched successfully', {
//             accountId: account.id,
//             scenarioSlug: scenario.slug,
//         });

//         Context.current().heartbeat('Preparing Instagram post data');

//         // Prepare caption from scenario
//         const caption = prepareCaption(scenario.texts);

//         // Select location based on scenario or account settings
//         const {instagramLocationSource, instagramLocations} = scenario;
//         const localLocations =
//             instagramLocationSource === InstagramLocationSource.Scenario
//                 ? instagramLocations
//                 : account.instagramLocations;

//         const randomLocation = getRandomElementOfArray(localLocations || []);
//         const locationId = randomLocation?.externalId;

//         log('Prepared Instagram post data', {
//             caption: caption?.substring(0, 100) + '...',
//             locationId,
//             videoUrl: processedVideoUrl,
//         });

//         Context.current().heartbeat('Creating Instagram media container');

//         // Create Instagram media container via Graph API
//         const result = await createInstagramPostContainer({
//             caption,
//             videoUrl: processedVideoUrl,
//             locationId,
//             accessToken: account.token,
//         });

//         if (!result.success || !result.mediaContainerId) {
//             throw new ThrownError(
//                 `Failed to create Instagram container: ${result.error || 'Unknown error'}`,
//                 500,
//             );
//         }

//         log('Instagram container created successfully', {
//             mediaContainerId: result.mediaContainerId,
//         });

//         Context.current().heartbeat('Saving container to database');

//         // Save container to database
//         // Note: We would need to pass a database connection here
//         // For now, we'll return the success status
//         // In a real implementation, this would be handled by the Worker's database connection

//         log('Container creation completed', {
//             mediaContainerId: result.mediaContainerId,
//             accountId,
//             scenarioId,
//             sourceId,
//         });

//         return {
//             success: true,
//             mediaContainerId: result.mediaContainerId,
//             creationId: result.mediaContainerId, // Same as container ID for Instagram
//         };
//     } catch (error) {
//         log('Error in createInstagramContainer activity', {
//             error,
//             accountId,
//             scenarioId,
//             sourceId,
//         });

//         if (error instanceof ThrownError) {
//             return {
//                 success: false,
//                 error: `${error.message} (Code: ${error.code})`,
//             };
//         }

//         return {
//             success: false,
//             error: error instanceof Error ? error.message : 'Unknown error occurred',
//         };
//     }
// }

// // eslint-disable-next-line valid-jsdoc
// /**
//  * Publish Instagram post activity - polls for container readiness and publishes
//  * Based on publishInstagramPostContainer and polling logic
//  */
// export async function publishInstagramPost(
//     input: PublishInstagramPostInput,
// ): Promise<PublishInstagramPostResult> {
//     const {mediaContainerId, accountId, creationId} = input;
//     const containerId = creationId || mediaContainerId;

//     try {
//         log('Starting publishInstagramPost activity', {
//             containerId,
//             accountId,
//         });

//         Context.current().heartbeat('Fetching account data');

//         // Fetch account for access token
//         const account = await fetchGet<IAccount>({
//             route: FetchRoutes.getAccountById,
//             query: {id: accountId},
//         });

//         if (!account) {
//             throw new ThrownError(`Account with id ${accountId} not found`, 404);
//         }

//         if (!account.token) {
//             throw new ThrownError(`Account with id ${accountId} has no access token`, 400);
//         }

//         log('Account fetched successfully', {accountId: account.id});

//         Context.current().heartbeat('Checking container readiness');

//         // Poll for container readiness with retries
//         let isReady = false;
//         const maxRetries = 20; // Up to 10 minutes with 30s intervals
//         const delayBetweenRetries = 30000; // 30 seconds

//         for (let attempt = 1; attempt <= maxRetries; attempt++) {
//             log(`Checking if container is ready (attempt ${attempt}/${maxRetries})`);

//             Context.current().heartbeat(`Checking readiness: attempt ${attempt}/${maxRetries}`);

//             isReady = await canInstagramPostBePublished({
//                 mediaContainerId: containerId,
//                 accessToken: account.token,
//             });

//             if (isReady) {
//                 log(`Container is ready to publish on attempt ${attempt}`);
//                 break;
//             }

//             if (attempt < maxRetries) {
//                 log(
//                     `Container not ready, waiting ${
//                         delayBetweenRetries / 1000
//                     } seconds before retry...`,
//                 );
//                 await delay(delayBetweenRetries);
//             }
//         }

//         if (!isReady) {
//             throw new ThrownError(
//                 `Container ${containerId} was not ready after ${maxRetries} attempts`,
//                 408,
//             );
//         }

//         Context.current().heartbeat('Publishing Instagram post');

//         // Publish the container
//         const publishResponse = await publishInstagramPostContainer({
//             containerId,
//             accessToken: account.token,
//         });

//         if (!publishResponse.success) {
//             throw new ThrownError(
//                 `Failed to publish Instagram post: ${publishResponse.error || 'Unknown error'}`,
//                 500,
//             );
//         }

//         log('Instagram post published successfully', {
//             postId: publishResponse.postId,
//             containerId,
//         });

//         return {
//             success: true,
//             postId: publishResponse.postId,
//             permalinkUrl: `https://www.instagram.com/p/${publishResponse.postId}/`, // Instagram post URL format
//         };
//     } catch (error) {
//         log('Error in publishInstagramPost activity', {
//             error,
//             containerId,
//             accountId,
//         });

//         if (error instanceof ThrownError) {
//             return {
//                 success: false,
//                 error: `${error.message} (Code: ${error.code})`,
//             };
//         }

//         return {
//             success: false,
//             error: error instanceof Error ? error.message : 'Unknown error occurred',
//         };
//     }
// }
