import {Router as expressRouter} from 'express';

import {getInsightsInstagramReportGet} from '../instagram/controllers';

import {
    createUserPost,
    deleteUserDelete,
    getAllCommentsForPostsGet,
    getAllUsersGet,
    getInstagramAccountInsightsGet,
    getUserByEmailGet,
    getUserByIdGet,
    uiConvertImageToVideoPost,
    uiGetInsightsGet,
    uiGetInstagramMediaGet,
    uiGetInstagramUserIdByMediaIdGet,
    uiGetMediaPostsGet,
    uiGetUserContentGet,
    uiSplitVideoInTheMiddlePost,
    uiTestGreenScreenPost,
    updateUserPatch,
} from './controllers';

const router = expressRouter();

// GET routes
router.get('/get-media-posts', uiGetMediaPostsGet);

// router.get('/download-video-from-source-v3', uiDownloadVideoFromSourceV3);
router.get('/get-insights', uiGetInsightsGet);
router.get('/get-media', uiGetInstagramMediaGet);
// router.get('/get-user-by-id', uiGetInstagramUserById);
router.get('/get-owner-by-media-id', uiGetInstagramUserIdByMediaIdGet);
router.get('/get-user-content', uiGetUserContentGet);
router.get('/get-user-by-id', getUserByIdGet);
router.get('/get-user-by-email', getUserByEmailGet);
router.get('/get-all-users', getAllUsersGet);
router.get('/get-instagram-account-insights', getInstagramAccountInsightsGet);
router.get('/get-all-comments-for-posts', getAllCommentsForPostsGet);

// POST routes
router.post('/split-video-in-the-middle', uiSplitVideoInTheMiddlePost);
router.post('/test-green-screen', uiTestGreenScreenPost);

router.post('/convert-image-to-video', uiConvertImageToVideoPost);
router.post('/create-user', createUserPost);

// PATCH routes

router.patch('/update-user', updateUserPatch);

// DELETE routes
router.delete('/delete-user', deleteUserDelete);

router.get('/get-insights-report', getInsightsInstagramReportGet);

export default router;
