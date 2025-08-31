// Temporal Workflow Component
import {
    getTemporalClient,
    getWorkflowResult,
    getWorkflowStatus,
    startVideoDownloadingWorkflow,
} from '../client';

import {
    GetWorkflowResultParams,
    GetWorkflowResultResponse,
    GetWorkflowStatusParams,
    GetWorkflowStatusResponse,
    StartVideoDownloadingWorkflowParams,
    StartVideoDownloadingWorkflowResponse,
    TemporalHealthParams,
    TemporalHealthResponse,
} from '#schemas/handlers/temporal';
import {ApiFunctionPrototype} from '#src/types/common';
import {log} from '#src/utils/logging';

// Handler functions
export const startVideoDownloadingWorkflowHandler: ApiFunctionPrototype<
    StartVideoDownloadingWorkflowParams,
    StartVideoDownloadingWorkflowResponse
> = async (params) => {
    try {
        const {sourceId} = params;

        log('Starting video workflow', {sourceId});

        // Start workflow
        const workflowResult = await startVideoDownloadingWorkflow(
            {
                sourceId,
            },
            {
                organizationId: 1, // Default organization ID for testing
            },
        );

        log('Video workflow started successfully', {
            workflowId: workflowResult.workflowId,
            runId: workflowResult.runId,
        });

        return {
            result: {
                success: true,
                workflowId: workflowResult.workflowId,
                runId: workflowResult.runId,
            },
            code: 200,
        };
    } catch (error) {
        log('Error starting video workflow', {error, params});

        // Check if this is a Temporal Server connection error
        if (error instanceof Error && error.message.includes('connect')) {
            return {
                result: {
                    success: false,
                    error: 'Temporal Server unavailable',
                    details: 'Unable to connect to Temporal Server. Please try again later.',
                },
                code: 503,
            };
        }

        return {
            result: {
                success: false,
                error: 'Failed to start workflow',
                details: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            code: 500,
        };
    }
};

export const getWorkflowStatusHandler: ApiFunctionPrototype<
    GetWorkflowStatusParams,
    GetWorkflowStatusResponse
> = async (params) => {
    try {
        const {workflowId} = params;

        log('Getting workflow status', {workflowId});

        const status = await getWorkflowStatus(workflowId);

        return {
            result: {
                success: true,
                workflowId,
                status: status.status,
                runId: status.runId,
                startTime: status.startTime.toISOString(),
            },
            code: 200,
        };
    } catch (error) {
        log('Error getting workflow status', {error, workflowId: params.workflowId});

        if (error instanceof Error && error.message.includes('not found')) {
            return {
                result: {
                    success: false,
                    error: 'Workflow not found',
                    details: `Workflow with ID ${params.workflowId} does not exist`,
                },
                code: 404,
            };
        }

        return {
            result: {
                success: false,
                error: 'Failed to get workflow status',
                details: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            code: 500,
        };
    }
};

export const getWorkflowResultHandler: ApiFunctionPrototype<
    GetWorkflowResultParams,
    GetWorkflowResultResponse
> = async (params) => {
    try {
        const {workflowId} = params;

        log('Getting workflow result', {workflowId});

        const workflowResult = await getWorkflowResult(workflowId);

        return {
            result: {
                success: true,
                workflowId,
                result: workflowResult,
            },
            code: 200,
        };
    } catch (error) {
        log('Error getting workflow result', {error, workflowId: params.workflowId});

        if (error instanceof Error && error.message.includes('not found')) {
            return {
                result: {
                    success: false,
                    error: 'Workflow not found',
                    details: `Workflow with ID ${params.workflowId} does not exist`,
                },
                code: 404,
            };
        }

        return {
            result: {
                success: false,
                error: 'Failed to get workflow result',
                details: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            code: 500,
        };
    }
};

export const temporalHealthHandler: ApiFunctionPrototype<
    TemporalHealthParams,
    TemporalHealthResponse
> = async (_params, _db) => {
    try {
        // Try to get client without throwing error
        await getTemporalClient();

        return {
            result: {
                success: true,
                message: 'Temporal integration healthy',
                timestamp: new Date().toISOString(),
            },
            code: 200,
        };
    } catch (error) {
        log('Temporal health check failed', {error});

        return {
            result: {
                success: false,
                error: 'Temporal integration unhealthy',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            code: 503,
        };
    }
};
