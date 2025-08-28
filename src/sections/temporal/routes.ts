// Temporal API Routes for Video Workflow
import {Router as expressRouter} from 'express';

// import {
//     addVideoToQueue,
//     getPublishingStatus,
//     startPublishingWorkflow,
//     stopPublishingWorkflow,
// } from './controllers/video-publishing.controller';
import {
    getWorkflowResultGet,
    getWorkflowStatusGet,
    startVideoDownloadingWorkflowPost,
    temporalHealthGet,
} from './controllers/workflow.controller';

import {routes} from '#src/types/routes/temporal';

const {startVideoDownloadingWorkflow, workflowResult, workflowStatus, health} = routes;

const router = expressRouter();

// Temporal workflow routes
router.post(startVideoDownloadingWorkflow, startVideoDownloadingWorkflowPost);
router.get(workflowStatus, getWorkflowStatusGet);
router.get(workflowResult, getWorkflowResultGet);
router.get(health, temporalHealthGet);

// Video publishing routes
// router.post('/video-publishing/add-video', addVideoToQueue);
// router.get('/video-publishing/status', getPublishingStatus);
// router.post('/video-publishing/start', startPublishingWorkflow);
// router.post('/video-publishing/stop', stopPublishingWorkflow);

export default router;
