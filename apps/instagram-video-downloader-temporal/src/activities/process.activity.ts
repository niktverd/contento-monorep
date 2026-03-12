// Process Video Activity for Temporal Workflow
import {rmSync} from 'fs';

import {Context} from '@temporalio/activity';

import db from '../database';
// import {createPreparedVideo} from '#src/db/prepared-videos';
import {IScenario} from '#types';
import {ScenarioType} from '#types';
import {ProcessVideoActivityArgs, ProcessVideoActivityResponse} from '#types';

import { NotRetryableError } from 'src/utils/error';
import { createPreparedVideo } from 'src/database/api/prepared-videos';
import { getVideoDuration } from 'src/video-production/video';
import { ScenarioMap } from 'src/video-production/scenarios/ScenarioMap';
import { getWorkingDirectoryForVideo, uploadFileToServer } from 'src/utils/common';
import { formatLog } from 'src/utils/log';

// eslint-disable-next-line valid-jsdoc
/**
 * Process video activity - executes scenario processing on downloaded video
 * Based on runScenarioHandler logic from src/sections/cloud-run/components/run-scenario/index.ts
 */
export async function processVideo(
    input: ProcessVideoActivityArgs,
): Promise<ProcessVideoActivityResponse> {
    

    const {source, account, scenario} = input;

    Context.current().log.info(formatLog('Starting processVideo activity', {
        scenarioId: scenario.id,
        accountId: account.id,
        sourceId: source.id,
    }));

    // Send heartbeat for long-running operations
    Context.current().heartbeat('Fetching scenario, account, and source data');

    // Validate all fetched data
    if (!scenario) {
        throw new NotRetryableError(`Scenario is not provided`, 404);
    }
    if (!account) {
        throw new NotRetryableError(`Account is not provided`, 404);
    }
    if (!source) {
        throw new NotRetryableError(`Source is not provided`, 404);
    }
    if (!source.firebaseUrl) {
        throw new NotRetryableError(`Source has no firebaseUrl`, 404);
    }

    Context.current().log.info(formatLog('Data fetched successfully', {
        scenarioSlug: scenario.slug,
        accountId: account.id,
        sourceId: source.id,
    }));

    Context.current().heartbeat('Validating scenario permissions and settings');

    // Validate scenario is available for account
    const isScenarioInAccount = Boolean(
        (account.availableScenarios as IScenario[])?.find(
            (accountScenario: IScenario) => accountScenario.slug === scenario.slug,
        ),
    );

    if (!isScenarioInAccount) {
        throw new NotRetryableError(
            `Scenario with id ${scenario.id} not available for account with id ${account.id}`,
            400,
        );
    }

    // Validate scenario is enabled
    if (!scenario.enabled) {
        throw new NotRetryableError(`Scenario with id ${scenario.id} is not enabled`, 400);
    }
    if (!account.enabled) {
        throw new NotRetryableError(`Account with id ${account.id} is not enabled`, 400);
    }

    // Get scenario workflow function
    const scenarioWorkflow = ScenarioMap[scenario.type as ScenarioType];
    if (!scenarioWorkflow) {
        throw new NotRetryableError(
            `Scenario workflow not found for scenario type ${scenario.type}`,
            400,
        );
    }

    const {scenario: scenarioFunction, schema} = scenarioWorkflow;

    // Validate scenario configuration
    const {success, error} = schema.safeParse(scenario);
    if (!success) {
        throw new NotRetryableError(
            `Scenario with id ${scenario.id} has invalid configuration: ${JSON.stringify(error)}`,
            400,
        );
    }

    if (!scenarioFunction) {
        throw new NotRetryableError(
            `Scenario function not found for scenario with id ${scenario.id}`,
            400,
        );
    }

    Context.current().log.info(formatLog('Scenario validation passed, starting video processing'));

    Context.current().heartbeat('Preparing working directory for video processing');

    // Prepare working directory and source for processing
    const directoryName = `temporal-${account.id}-${scenario.id}-${source.id}-${Date.now()}`;
    const basePath = getWorkingDirectoryForVideo(directoryName);

    Context.current().log.info(formatLog('Starting scenario function execution', {scenarioType: scenario.type, basePath}));

    Context.current().heartbeat('Executing video processing scenario');

    // Execute scenario function (this is where the actual video processing happens)
    const finalFilePath = await scenarioFunction({
        scenario,
        source,
        basePath,
    });

    Context.current().log.info(formatLog('Scenario function completed', {finalFilePath}));

    Context.current().heartbeat('Calculating video duration and uploading result');

    // Get duration of processed video
    const duration = await getVideoDuration(finalFilePath);

    // Upload processed video to Firebase Storage
    const uploadFileName = `${directoryName}-${scenario.slug}.mp4`;
    const processedUrl = await uploadFileToServer(finalFilePath, uploadFileName);

    Context.current().log.info(formatLog('Video processing completed successfully', {
        processedUrl,
        duration,
        uploadFileName,
    }));

    Context.current().heartbeat('Saving processed video to database');

    // Save prepared video to database
    const savedPreparedVideo = await createPreparedVideo(
        {
            firebaseUrl: processedUrl,
            scenarioId: scenario.id,
            sourceId: source.id,
            accountId: account.id,
            duration,
        },
        db,
        {organizationId: source.organizationId},
    );

    Context.current().log.info(formatLog('Processed video saved to database', {savedPreparedVideo}));

    // Clean up temporary files
    Context.current().heartbeat('Cleaning up temporary files');

    try {
        rmSync(basePath, {recursive: true});
        Context.current().log.info(formatLog('Temporary files cleaned up', {basePath}));
    } catch (cleanupError) {
        Context.current().log.error(formatLog('Warning: Failed to clean up temporary files', {basePath, cleanupError}));
        // Don't fail the whole activity if cleanup fails
        Context.current().heartbeat('Failed to clean up temporary files');
    }

    return {
        success: true,
        processedUrl,
        duration,
    };
}
