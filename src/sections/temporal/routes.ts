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

const router = expressRouter();

// Temporal workflow routes
router.post('/start-video-downloading-workflow', startVideoDownloadingWorkflowPost);
router.get('/workflow-status/:workflowId', getWorkflowStatusGet);
router.get('/workflow-result/:workflowId', getWorkflowResultGet);
router.get('/health', temporalHealthGet);

// Video publishing routes
// router.post('/video-publishing/add-video', addVideoToQueue);
// router.get('/video-publishing/status', getPublishingStatus);
// router.post('/video-publishing/start', startPublishingWorkflow);
// router.post('/video-publishing/stop', stopPublishingWorkflow);

export default router;
