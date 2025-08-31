// Instagram Activities for Temporal Workflow
import {Context} from '@temporalio/activity';

import {
    createInstagramMediaContainer,
    getAccountById,
    getDb,
    getOnePreparedVideo,
    getScenarioById,
    updateInstagramMediaContainer,
} from '#src/db';
import {
    canInstagramPostBePublished,
    createInstagramPostContainer,
    publishInstagramPostContainer,
} from '#src/sections/instagram/components/instagram';
import {InstagramLocationSource} from '#src/types';
import {
    CreateInstagramContainerInput,
    CreateInstagramContainerResult,
    PublishInstagramPostInput,
    PublishInstagramPostResult,
} from '#src/types/temporal';
import {delay, getRandomElementOfArray, prepareCaption} from '#src/utils';
import {NotRetryableError, ThrownError} from '#src/utils/error';
import {log} from '#src/utils/logging';

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
        log('Starting createInstagramContainer activity', {
            firebaseUrl,
            accountId,
            scenarioId,
            sourceId,
        });

        Context.current().heartbeat('Fetching account and scenario data');

        // Fetch account and scenario data
        const db = getDb();
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

        log('Account and scenario fetched successfully', {
            accountId: account.id,
            scenarioSlug: scenario.slug,
        });

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

        log('Prepared Instagram post data', {
            caption: caption?.substring(0, 100) + '...',
            locationId,
            firebaseUrl,
        });

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

        log('Instagram container created successfully', {
            mediaContainerId: result.mediaContainerId,
        });

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

        log('Container creation completed', {
            mediaContainerId: result.mediaContainerId,
            instagramMediaContainerId,
            accountId,
            scenarioId,
            sourceId,
        });

        return {
            success: true,
            mediaContainerId: result.mediaContainerId,
            creationId: result.mediaContainerId, // Same as container ID for Instagram
            instagramMediaContainerId,
        };
    } catch (error) {
        log('Error in createInstagramContainer activity', {
            error,
            accountId,
            scenarioId,
            sourceId,
        });

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
    const db = getDb();

    try {
        log('Starting publishInstagramPost activity', {
            mediaContainerId,
            account,
        });

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

        log('Account fetched successfully', {accountId: account.id});

        Context.current().heartbeat('Checking container readiness');

        // Poll for container readiness with retries
        let isReady = false;
        const maxRetries = 20; // Up to 10 minutes with 30s intervals
        const delayBetweenRetries = 30000; // 30 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            log(`Checking if container is ready (attempt ${attempt}/${maxRetries})`);

            Context.current().heartbeat(`Checking readiness: attempt ${attempt}/${maxRetries}`);

            isReady = await canInstagramPostBePublished({
                mediaContainerId,
                accessToken: account.token,
            });

            if (isReady) {
                log(`Container is ready to publish on attempt ${attempt}`);
                break;
            }

            if (attempt < maxRetries) {
                log(
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

        log('Instagram post published successfully', {
            postId: publishResponse.postId,
            mediaContainerId,
            instagramMediaContainerId,
        });

        // Update DB record to mark as published
        if (instagramMediaContainerId) {
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
                log('Failed to update instagram media container record', {
                    error: dbUpdateError,
                    instagramMediaContainerId,
                });
            }
        }

        return {
            success: true,
            postId: publishResponse.postId,
        };
    } catch (error) {
        log('Error in publishInstagramPost activity', {
            error,
            mediaContainerId,
            accountId: account?.id,
        });

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
    const db = getDb();
    const {result} = await getOnePreparedVideo({accountId, random: true}, db, {
        organizationId,
    });

    return result;
};
