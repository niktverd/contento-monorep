// Video Processing Workflow for Temporal
import {proxyActivities, log as workflowLog} from '@temporalio/workflow';

import type {OptionsActivityArgs, VideoDownloadingWorkflowArgs} from '#types';
import type * as activities from '../activities';

// Configure activity proxies with appropriate timeouts for each operation type
const {downloadVideo, getAccountsActivity, runProcessingActivity} = proxyActivities<
    typeof activities
>({
    startToCloseTimeout: '45s',
    scheduleToCloseTimeout: '2 minutes',
    retry: {
        initialInterval: '5 seconds',
        maximumInterval: '1 minute',
        backoffCoefficient: 2,
        maximumAttempts: 3,
        nonRetryableErrorTypes: [],
    },
});

// eslint-disable-next-line valid-jsdoc
/**
 * Main video downloading workflow
 * Orchestrates the complete video pipeline: Download → Process → Create Container → Publish
 */
export async function videoDownloadingWorkflow(
    input: VideoDownloadingWorkflowArgs,
    options: OptionsActivityArgs,
): Promise<void> {
    const {sourceId} = input;

    workflowLog.info('Starting video downloading workflow', {
        sourceId,
        workflowId: `video-downloading-${sourceId}`,
    });

    // Step 1: Download video (if not already available)
    workflowLog.info('Step 1: Downloading video', {sourceId});

    const downloadResult = await downloadVideo(input, options);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source = downloadResult.source as any;

    workflowLog.info('Step 1 completed: Video downloaded successfully', {
        firebaseUrl: source.firebaseUrl,
        duration: source.duration,
    });

    // Step 2: Process video with scenario
    workflowLog.info('Step 2: get accounts and scenarios', {
        sourceId,
        firebaseUrl: source.firebaseUrl,
    });

    const accounts = await getAccountsActivity(options.organizationId);

    workflowLog.info('Step 2 completed: Accounts ready to process', {
        accounts: accounts.accounts.length,
    });

    for (const account of accounts.accounts) {
        const scenarios = account.availableScenarios;
        for (const scenario of scenarios || []) {
            await runProcessingActivity({
                source,
                account,
                scenario,
            });
        }
    }
}
