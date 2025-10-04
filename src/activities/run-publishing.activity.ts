import {videoPublishingWorkflow} from '../workflows';

import {getTemporalClient} from '../client';
import {RunPublishingActivityArgs, RunPublishingActivityResponse} from '#types';

import { Context } from '@temporalio/activity';
import { formatLog } from 'src/utils/log';

// eslint-disable-next-line valid-jsdoc
/**
 * Run publishing activity - starts the video publishing workflow.
 */
export async function runPublishingActivity(
    input: RunPublishingActivityArgs,
): Promise<RunPublishingActivityResponse> {
    
    
    const client = await getTemporalClient();
    const taskQueue = 'process-video-publishing';

    const {preparedVideo, account} = input;

    // Generate unique workflow ID
    const workflowId = `video-publishing-exec-${preparedVideo.id}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

    Context.current().log.info(formatLog('Starting video publishing workflow', {
        workflowId,
        input,
        taskQueue,
    }));

    const handle = await client.workflow.start(videoPublishingWorkflow, {
        args: [preparedVideo, account],
        taskQueue,
        workflowId,
        workflowExecutionTimeout: '1 hour', // Total timeout for entire workflow
        workflowRunTimeout: '1 hour', // Timeout for single run
        workflowTaskTimeout: '1 minute', // Timeout for workflow decisions
        retry: {
            maximumAttempts: 3,
            initialInterval: '10s',
            maximumInterval: '1m',
            backoffCoefficient: 2,
        },
    });

    return {
        success: true,
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
    };
}
