// Download Video Activity for Temporal Workflow
import {videoProcessingWorkflow} from '../workflows';

import {getTemporalClient} from '#src/sections/temporal/client';
import {RunProcessingActivityArgs, RunProcessingActivityResponse} from '#src/types/temporal';
import {log} from '#utils';

// eslint-disable-next-line valid-jsdoc
/**
 * Run processing activity - runs the video processing workflow
 */
export async function runProcessingActivity(
    input: RunProcessingActivityArgs,
): Promise<RunProcessingActivityResponse> {
    const client = await getTemporalClient();
    const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'video-processing';
    const {source, account, scenario} = input;

    // Generate unique workflow ID
    const workflowId = `video-processing-${source.id}-${account.id}-${
        scenario.id
    }-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    log('Starting video workflow', {
        workflowId,
        input,
        taskQueue,
    });

    const handle = await client.workflow.start(videoProcessingWorkflow, {
        args: [{account, scenario, source}],
        taskQueue,
        workflowId,
        workflowExecutionTimeout: '60 minutes', // Total timeout for entire workflow
        workflowRunTimeout: '30 minutes', // Timeout for single run
        workflowTaskTimeout: '20 minute', // Timeout for workflow decisions
    });

    return {
        success: true,
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
    };
}
