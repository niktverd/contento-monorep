import {Client, Connection, WorkflowHandle} from '@temporalio/client';

import {videoDownloadingWorkflow} from '../../temporal/workflows';

import {OptionsActivityArgs, VideoDownloadingWorkflowArgs} from '#src/types/temporal';
import {log} from '#utils';

let temporalClient: Client | null = null;

// eslint-disable-next-line valid-jsdoc
/**
 * Get or create Temporal client instance
 * Singleton pattern to reuse connection
 */
export async function getTemporalClient(): Promise<Client> {
    if (!temporalClient) {
        const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
        const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

        const connection = await Connection.connect({
            address,
        });

        temporalClient = new Client({
            connection,
            namespace,
        });

        log(`Temporal client connected to ${address}, namespace: ${namespace}`);
    }

    return temporalClient;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Start video processing workflow
 * Returns workflow handle for monitoring and results
 */
export async function startVideoDownloadingWorkflow(
    input: VideoDownloadingWorkflowArgs,
    options: OptionsActivityArgs,
): Promise<{
    workflowId: string;
    runId: string;
    handle: WorkflowHandle;
}> {
    const client = await getTemporalClient();
    const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'video-downloading';

    // Generate unique workflow ID
    const workflowId = `video-downloading-${input.sourceId}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

    log('Starting video workflow', {
        workflowId,
        input,
        taskQueue,
    });

    const handle = await client.workflow.start(videoDownloadingWorkflow, {
        args: [input, options],
        taskQueue,
        workflowId,
        workflowExecutionTimeout: '3 minutes', // Total timeout for entire workflow
        workflowRunTimeout: '2 minutes', // Timeout for single run
        workflowTaskTimeout: '1 minute', // Timeout for workflow decisions
        retry: {
            maximumAttempts: 5,
            initialInterval: '10 seconds',
            backoffCoefficient: 2,
        },
    });

    return {
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
        handle,
    };
}

// eslint-disable-next-line valid-jsdoc
/**
 * Get workflow result by workflow ID
 * Useful for checking status of previously started workflows
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWorkflowResult(workflowId: string): Promise<any> {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);
    return await handle.result();
}

// eslint-disable-next-line valid-jsdoc
/**
 * Get workflow status without waiting for result
 * Returns current execution status
 */
export async function getWorkflowStatus(workflowId: string): Promise<{
    status: string;
    runId: string;
    startTime: Date;
}> {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);
    const execution = await handle.describe();

    return {
        status: execution.status.name,
        runId: execution.runId,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        startTime: execution.startTime!,
    };
}

// eslint-disable-next-line valid-jsdoc
/**
 * Cancel workflow by workflow ID
 * Useful for emergency stops
 */
export async function cancelWorkflow(workflowId: string, _reason?: string): Promise<void> {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);
    await handle.cancel();
}
