// Temporal API Routes for Video Workflow
import {Router as expressRouter} from 'express';

import {
    getWorkflowResultGet,
    getWorkflowStatusGet,
    startVideoDownloadingWorkflowPost,
    temporalHealthGet,
} from './controllers/workflow.controller';

const router = expressRouter();

// Temporal workflow routes
router.post('/start-video-downloading-workflow', startVideoDownloadingWorkflowPost);
router.get('/workflow-status/:workflowId', getWorkflowStatusGet);
router.get('/workflow-result/:workflowId', getWorkflowResultGet);
router.get('/health', temporalHealthGet);

export default router;
