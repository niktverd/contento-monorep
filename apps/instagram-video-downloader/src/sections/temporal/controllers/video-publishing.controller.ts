// import {Request, Response} from 'express';

// import {
//     addVideoToPublishingQueue,
//     getVideoPublishingWorkflowStatus,
//     startVideoPublishingWorkflow,
//     stopVideoPublishingWorkflow,
// } from '#src/sections/temporal/client';
// import {VideoForPublishing} from '#src/types/temporal';
// import {ThrownError} from '#src/utils/error';
// import {log} from '#src/utils/logging';

// /**
//  * Add video to publishing queue
//  * POST /temporal/video-publishing/add-video
//  * @param req - Express request object containing video data
//  * @param res - Express response object
//  * @returns Promise<void>
//  */
// export async function addVideoToQueue(req: Request, res: Response): Promise<void> {
//     try {
//         const video: VideoForPublishing = req.body;

//         log('Adding video to publishing queue', {
//             videoId: video.preparedVideo.id,
//             accountId: video.preparedVideo.accountId,
//         });

//         // Use client method to add video to queue
//         const result = await addVideoToPublishingQueue(video);

//         log('Video added to publishing queue successfully', {
//             videoId: video.preparedVideo.id,
//             workflowId: result.workflowId,
//         });

//         res.status(200).json({
//             success: true,
//             message: 'Video added to publishing queue',
//             videoId: video.preparedVideo.id,
//             workflowId: result.workflowId,
//         });
//     } catch (error) {
//         log('Error adding video to publishing queue', {error});

//         if (error instanceof ThrownError) {
//             res.status(error.code).json({
//                 success: false,
//                 error: error.message,
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 error: 'Internal server error',
//             });
//         }
//     }
// }

// /**
//  * Get video publishing workflow status
//  * GET /temporal/video-publishing/status
//  * @param req - Express request object
//  * @param res - Express response object
//  * @returns Promise<void>
//  */
// export async function getPublishingStatus(req: Request, res: Response): Promise<void> {
//     try {
//         log('Getting video publishing workflow status');

//         // Use client method to get workflow status
//         const status = await getVideoPublishingWorkflowStatus();

//         log('Publishing workflow status retrieved', {
//             workflowId: status.workflowId,
//             status: status.status,
//         });

//         res.status(200).json({
//             success: true,
//             workflowId: status.workflowId,
//             status: status.status,
//             runId: status.runId,
//             startTime: status.startTime,
//         });
//     } catch (error) {
//         log('Error getting publishing workflow status', {error});

//         if (error instanceof ThrownError) {
//             res.status(error.code).json({
//                 success: false,
//                 error: error.message,
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 error: 'Internal server error',
//             });
//         }
//     }
// }

// /**
//  * Start video publishing workflow manually
//  * POST /temporal/video-publishing/start
//  * @param req - Express request object
//  * @param res - Express response object
//  * @returns Promise<void>
//  */
// export async function startPublishingWorkflow(req: Request, res: Response): Promise<void> {
//     try {
//         log('Starting video publishing workflow manually');

//         // Use client method to start workflow
//         const result = await startVideoPublishingWorkflow({});

//         log('Video publishing workflow started', {
//             workflowId: result.workflowId,
//             runId: result.runId,
//         });

//         res.status(200).json({
//             success: true,
//             message: 'Video publishing workflow started',
//             workflowId: result.workflowId,
//             runId: result.runId,
//         });
//     } catch (error) {
//         log('Error starting video publishing workflow', {error});

//         if (error instanceof ThrownError) {
//             res.status(error.code).json({
//                 success: false,
//                 error: error.message,
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 error: 'Internal server error',
//             });
//         }
//     }
// }

// /**
//  * Stop video publishing workflow
//  * POST /temporal/video-publishing/stop
//  * @param req - Express request object
//  * @param res - Express response object
//  * @returns Promise<void>
//  */
// export async function stopPublishingWorkflow(req: Request, res: Response): Promise<void> {
//     try {
//         log('Stopping video publishing workflow');

//         // Use client method to stop workflow
//         await stopVideoPublishingWorkflow('Manually stopped');

//         log('Video publishing workflow stopped', {
//             workflowId: 'video-publisher',
//         });

//         res.status(200).json({
//             success: true,
//             message: 'Video publishing workflow stopped',
//             workflowId: 'video-publisher',
//         });
//     } catch (error) {
//         log('Error stopping video publishing workflow', {error});

//         if (error instanceof ThrownError) {
//             res.status(error.code).json({
//                 success: false,
//                 error: error.message,
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 error: 'Internal server error',
//             });
//         }
//     }
// }
