import {getFullRoutes} from './utils';

export const rootName = '/temporal';

export const routes = {
    startVideoDownloadingWorkflow: '/start-video-downloading-workflow',
    workflowStatus: '/workflow-status/:workflowId',
    workflowResult: '/workflow-result/:workflowId',
    health: '/health',
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
