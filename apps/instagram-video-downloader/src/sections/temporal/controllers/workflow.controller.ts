// Temporal Workflow Controllers
import {
    getWorkflowResultHandler,
    getWorkflowStatusHandler,
    startVideoDownloadingWorkflowHandler,
    temporalHealthHandler,
} from '../components/workflow.component';

import {wrapper} from '#src/db/utils';
import {
    GetWorkflowResultParams,
    GetWorkflowResultResponse,
    GetWorkflowStatusParams,
    GetWorkflowStatusParamsSchema,
    GetWorkflowStatusResponse,
    StartVideoDownloadingWorkflowParams,
    StartVideoDownloadingWorkflowParamsSchema,
    StartVideoDownloadingWorkflowResponse,
    TemporalHealthParams,
    TemporalHealthParamsSchema,
    TemporalHealthResponse,
} from '#src/types/schemas/handlers/temporal';

// Exported controllers using wrapper
export const startVideoDownloadingWorkflowPost = wrapper<
    StartVideoDownloadingWorkflowParams,
    StartVideoDownloadingWorkflowResponse
>(startVideoDownloadingWorkflowHandler, StartVideoDownloadingWorkflowParamsSchema, 'POST');

export const getWorkflowStatusGet = wrapper<GetWorkflowStatusParams, GetWorkflowStatusResponse>(
    getWorkflowStatusHandler,
    GetWorkflowStatusParamsSchema,
    'GET',
);

export const getWorkflowResultGet = wrapper<GetWorkflowResultParams, GetWorkflowResultResponse>(
    getWorkflowResultHandler,
    GetWorkflowStatusParamsSchema,
    'GET',
);

export const temporalHealthGet = wrapper<TemporalHealthParams, TemporalHealthResponse>(
    temporalHealthHandler,
    TemporalHealthParamsSchema,
    'GET',
);
