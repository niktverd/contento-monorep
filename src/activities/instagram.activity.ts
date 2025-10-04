// Instagram Activities for Temporal Workflow
import {Context} from '@temporalio/activity';

import db from '../database';
// import {
//     createInstagramMediaContainer,
//     getAccountById,
//     getOnePreparedVideo,
//     getScenarioById,
//     updateInstagramMediaContainer,
// } from 'src/database/api';
import {
    canInstagramPostBePublished,
    createInstagramPostContainer,
    publishInstagramPostContainer,
} from 'src/instagram';
import {InstagramLocationSource} from '#types';
import {
    CreateInstagramContainerInput,
    CreateInstagramContainerResult,
    PublishInstagramPostInput,
    PublishInstagramPostResult,
} from '#types';
import { NotRetryableError, ThrownError } from 'src/utils/error';

import { getRandomElementOfArray, prepareCaption, delay } from 'src/utils/common';
import { getAccountById } from 'src/database/api/account';
import { getScenarioById } from 'src/database/api/scenario';
import { createInstagramMediaContainer, updateInstagramMediaContainer } from 'src/database/api/instagram-media-containers';
import { getOnePreparedVideo } from 'src/database/api/prepared-videos';
import { formatLog } from 'src/utils/log';

// eslint-disable-next-line valid-jsdoc
/**
 * Create Instagram container activity - creates a media container using Instagram Graph API
 * Based on prepareMediaContainersForAccount logic
 */
export async function createInstagramContainer(
    input: CreateInstagramContainerInput,
): Promise<CreateInstagramContainerResult> {
    const {preparedVideo} = input;
    

    if (!preparedVideo) {
        throw new NotRetryableError('Prepared video is required', 400);
    }

    const {firebaseUrl, accountId, scenarioId, sourceId} = preparedVideo;

    try {
        Context.current().log.info(formatLog('Starting createInstagramContainer activity', {
            firebaseUrl,
            accountId,
            scenarioId,
            sourceId,
        }));

        Context.current().heartbeat('Fetching account and scenario data');

        // Fetch account and scenario data
        const [{result: account}, {result: scenario}] = await Promise.all([
            getAccountById({id: accountId}, db, {organizationId: preparedVideo.organizationId}),
            getScenarioById({id: scenarioId}, db, {organizationId: preparedVideo.organizationId}),
        ]);

        if (!account) {
            throw new ThrownError(`Account with id ${accountId} not found`, 404);
        }

        if (!scenario) {
            throw new ThrownError(`Scenario with id ${scenarioId} not found`, 404);
        }

        if (!account.token) {
            throw new ThrownError(`Account with id ${accountId} has no access token`, 400);
        }

        Context.current().log.info(formatLog('Account and scenario fetched successfully', {
            accountId: account.id,
            scenarioSlug: scenario.slug,
        }));

        Context.current().heartbeat('Preparing Instagram post data');

        // Prepare caption from scenario
        const caption = prepareCaption(scenario.texts);

        // Select location based on scenario or account settings
        const {instagramLocationSource, instagramLocations} = scenario;
        const localLocations =
            instagramLocationSource === InstagramLocationSource.Scenario
                ? instagramLocations
                : account.instagramLocations;

        const randomLocation = getRandomElementOfArray(localLocations || []);
        const locationId = randomLocation?.externalId;

        Context.current().log.info(formatLog('Prepared Instagram post data', {
            caption: caption?.substring(0, 100) + '...',
            locationId,
            firebaseUrl,
        }));

        Context.current().heartbeat('Creating Instagram media container');

        // Create Instagram media container via Graph API
        const result = await createInstagramPostContainer({
            caption,
            videoUrl: firebaseUrl,
            locationId,
            accessToken: account.token,
        });

        if (!result.success || !result.mediaContainerId) {
            throw new ThrownError(
                `Failed to create Instagram container: ${result.error || 'Unknown error'}`,
                500,
            );
        }

        Context.current().log.info(formatLog('Instagram container created successfully', {
            mediaContainerId: result.mediaContainerId,
        }));

        Context.current().heartbeat('Persisting container info to database');

        // Persist container data to database
        const savedContainer = await createInstagramMediaContainer(
            {
                accountId: account.id,
                preparedVideoId: preparedVideo.id,
                containerId: result.mediaContainerId,
                caption,
                location: randomLocation,
            },
            db,
            {organizationId: account.organizationId},
        );

        const instagramMediaContainerId = savedContainer?.result?.id;

        Context.current().log.info(formatLog('Container creation completed', {
            mediaContainerId: result.mediaContainerId,
            instagramMediaContainerId,
            accountId,
            scenarioId,
            sourceId,
        }));

        return {
            success: true,
            mediaContainerId: result.mediaContainerId,
            creationId: result.mediaContainerId, // Same as container ID for Instagram
            instagramMediaContainerId,
        };
    } catch (error) {
        Context.current().log.error(formatLog('Error in createInstagramContainer activity', {
            error,
            accountId,
            scenarioId,
            sourceId,
        }));

        if (error instanceof ThrownError) {
            return {
                success: false,
                error: `${error.message} (Code: ${error.code})`,
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

// eslint-disable-next-line valid-jsdoc
/**
 * Publish Instagram post activity - polls for container readiness and publishes
 * Based on publishInstagramPostContainer and polling logic
 */
export async function publishInstagramPost(
    input: PublishInstagramPostInput,
): Promise<PublishInstagramPostResult> {
    

    const {mediaContainerId, account, instagramMediaContainerId} = input;

    try {
        Context.current().log.info(formatLog('Starting publishInstagramPost activity', {
            mediaContainerId,
            account,
        }));

        Context.current().heartbeat('Fetching account data');

        if (!mediaContainerId) {
            throw new ThrownError(`mediaContainerId is required`, 404);
        }

        if (!account) {
            throw new ThrownError(`Account not found`, 404);
        }

        if (!account.token) {
            throw new ThrownError(`Account with id ${account.id} has no access token`, 400);
        }

        Context.current().log.info(formatLog('Account fetched successfully', {accountId: account.id}));

        Context.current().heartbeat('Checking container readiness');

        // Poll for container readiness with retries
        let isReady = false;
        const maxRetries = 20; // Up to 10 minutes with 30s intervals
        const delayBetweenRetries = 30000; // 30 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            Context.current().log.info(`Checking if container is ready (attempt ${attempt}/${maxRetries})`);

            Context.current().heartbeat(`Checking readiness: attempt ${attempt}/${maxRetries}`);

            isReady = await canInstagramPostBePublished({
                mediaContainerId,
                accessToken: account.token,
            });

            if (isReady) {
                Context.current().log.info(`Container is ready to publish on attempt ${attempt}`);
                break;
            }

            if (attempt < maxRetries) {
                Context.current().log.info(
                    `Container not ready, waiting ${
                        delayBetweenRetries / 1000
                    } seconds before retry...`,
                );
                await delay(delayBetweenRetries);
            }
        }

        if (!isReady) {
            throw new ThrownError(
                `Container ${mediaContainerId} was not ready after ${maxRetries} attempts`,
                408,
            );
        }

        Context.current().heartbeat('Publishing Instagram post');

        // Publish the container
        const publishResponse = await publishInstagramPostContainer({
            containerId: mediaContainerId,
            accessToken: account.token,
        });

        if (!publishResponse.success) {
            throw new ThrownError(
                `Failed to publish Instagram post: ${publishResponse.error || 'Unknown error'}`,
                500,
            );
        }

        Context.current().log.info(formatLog('Instagram post published successfully', {
            postId: publishResponse.postId,
            mediaContainerId,
            instagramMediaContainerId,
        }));
        Context.current().log.info(formatLog(
            `Instagram post published successfully: ${JSON.stringify({
                postId: publishResponse.postId,
                mediaContainerId,
                instagramMediaContainerId,
            })}`,
        ));

        // Update DB record to mark as published
        if (instagramMediaContainerId) {
            Context.current().log.info(
                `updating instagram media container record: ${JSON.stringify({
                    id: instagramMediaContainerId,
                    mediaId: publishResponse.postId,
                    isPublished: true,
                    lastCheckedIGStatus: 'FINISHED',
                })}`,
            );
            Context.current().log.info(
                `updating instagram media container record: ${JSON.stringify({
                    id: instagramMediaContainerId,
                    mediaId: publishResponse.postId,
                    isPublished: true,
                    lastCheckedIGStatus: 'FINISHED',
                })}`,
            );
            try {
                await updateInstagramMediaContainer(
                    {
                        id: instagramMediaContainerId,
                        mediaId: publishResponse.postId,
                        isPublished: true,
                        lastCheckedIGStatus: 'FINISHED',
                    },
                    db,
                    {organizationId: account.organizationId},
                );
            } catch (dbUpdateError) {
                Context.current().log.info(formatLog('Failed to update instagram media container record', {
                    error: dbUpdateError,
                    instagramMediaContainerId,
                }));
                Context.current().log.error(formatLog(
                    `Failed to update instagram media container record: ${JSON.stringify({
                        error: dbUpdateError,
                        instagramMediaContainerId,
                    })}`,
                ));
            }
        }

        return {
            success: true,
            postId: publishResponse.postId,
        };
    } catch (error) {
        Context.current().log.info(formatLog('Error in publishInstagramPost activity', {
            error,
            mediaContainerId,
            accountId: account?.id,
        }));

        if (error instanceof ThrownError) {
            return {
                success: false,
                error: `${error.message} (Code: ${error.code})`,
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

export const getRandomPreparedVideForAccountActivity = async (
    accountId: number,
    organizationId: number,
) => {
    const {result} = await getOnePreparedVideo(
        {accountId, random: true, notInInstagramMediaContainers: true},
        db,
        {
            organizationId,
        },
    );

    return result;
};
