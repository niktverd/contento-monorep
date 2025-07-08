// Video Processing Workflow for Temporal
import {proxyActivities, log as workflowLog} from '@temporalio/workflow';

import type {IAccount, IScenario, ISource} from '../../types';
import type * as activities from '../activities';

// Configure activity proxies with appropriate timeouts for each operation type
const {processVideo} = proxyActivities<typeof activities>({
    startToCloseTimeout: '15 minutes', // ffmpeg can be slow
    scheduleToCloseTimeout: '20 minutes',
    heartbeatTimeout: '1 minute', // For long ffmpeg operations
    retry: {
        initialInterval: '10 seconds',
        maximumInterval: '2 minutes',
        backoffCoefficient: 2,
        maximumAttempts: 2, // Fewer retries for heavy operations
        nonRetryableErrorTypes: ['NotRetryableError'],
    },
});

// const {createInstagramContainer} = proxyActivities<typeof activities>({
//     startToCloseTimeout: '3 minutes',
//     scheduleToCloseTimeout: '5 minutes',
//     retry: {
//         initialInterval: '3 seconds',
//         maximumInterval: '30 seconds',
//         backoffCoefficient: 2,
//         maximumAttempts: 5, // Instagram API can have temporary issues
//         nonRetryableErrorTypes: ['NotRetryableError'],
//     },
// });

// const {publishInstagramPost} = proxyActivities<typeof activities>({
//     startToCloseTimeout: '10 minutes', // Includes polling time
//     scheduleToCloseTimeout: '15 minutes',
//     heartbeatTimeout: '1 minute', // For polling operations
//     retry: {
//         initialInterval: '5 seconds',
//         maximumInterval: '1 minute',
//         backoffCoefficient: 2,
//         maximumAttempts: 3,
//         nonRetryableErrorTypes: ['NotRetryableError'],
//     },
// });

// eslint-disable-next-line valid-jsdoc
/**
 * Main video processing workflow
 * Orchestrates the complete video pipeline: Download → Process → Create Container → Publish
 */

type VideoProcessingWorkflowInput = {
    source: ISource;
    account: IAccount;
    scenario: IScenario;
};

export async function videoProcessingWorkflow(input: VideoProcessingWorkflowInput) {
    const {source, account, scenario} = input;

    workflowLog.info('Starting video processing workflow', {
        sourceId: source.id,
        accountId: account.id,
        scenarioId: scenario.id,
        firebaseUrl: source.firebaseUrl,
        workflowId: 'video-processing',
    });

    const processResult = await processVideo({
        scenario,
        account,
        source,
    });

    // workflowLog.info('Step 2 completed: Video processed successfully', {
    //     processedUrl: processResult.processedUrl,
    //     duration: processResult.duration,
    // });

    // // Step 3: Create Instagram container
    // workflowLog.info('Step 3: Creating Instagram container', {
    //     processedUrl: processResult.processedUrl,
    //     accountId,
    // });

    // const containerResult = await createInstagramContainer({
    //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    //     processedVideoUrl: processResult.processedUrl!,
    //     accountId,
    //     scenarioId,
    //     sourceId,
    // });

    // if (!containerResult.success) {
    //     workflowLog.error('Container creation failed', {error: containerResult.error});
    //     return {
    //         success: false,
    //         step: 'createContainer',
    //         error: `Container creation failed: ${containerResult.error}`,
    //         sourceId,
    //         accountId,
    //         scenarioId,
    //         downloadUrl: downloadResult.firebaseUrl,
    //         processedUrl: processResult.processedUrl,
    //     };
    // }

    // workflowLog.info('Step 3 completed: Container created successfully', {
    //     mediaContainerId: containerResult.mediaContainerId,
    //     creationId: containerResult.creationId,
    // });

    // // Step 4: Publish Instagram post
    // workflowLog.info('Step 4: Publishing Instagram post', {
    //     mediaContainerId: containerResult.mediaContainerId,
    //     accountId,
    // });

    // const publishResult = await publishInstagramPost({
    //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    //     mediaContainerId: containerResult.mediaContainerId!,
    //     accountId,
    //     creationId: containerResult.creationId,
    // });

    // if (!publishResult.success) {
    //     workflowLog.error('Publishing failed', {error: publishResult.error});
    //     return {
    //         success: false,
    //         step: 'publish',
    //         error: `Publishing failed: ${publishResult.error}`,
    //         sourceId,
    //         accountId,
    //         scenarioId,
    //         downloadUrl: downloadResult.firebaseUrl,
    //         processedUrl: processResult.processedUrl,
    //         mediaContainerId: containerResult.mediaContainerId,
    //     };
    // }

    // workflowLog.info('Workflow completed successfully', {
    //     postId: publishResult.postId,
    //     permalinkUrl: publishResult.permalinkUrl,
    // });

    // Return complete success result
    return {
        success: true,
        sourceId: source.id,
        accountId: account.id,
        scenarioId: scenario.id,
        processedUrl: processResult.processedUrl,
        duration: processResult.duration,
    };
}
