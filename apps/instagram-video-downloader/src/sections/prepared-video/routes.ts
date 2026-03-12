import {Router as expressRouter} from 'express';

import {authMiddleware, checkPermissions, requireOrganizationHeader} from '../../middleware';

import {
    createPreparedVideoPost,
    deletePreparedVideoDelete,
    findPreparedVideoDuplicatesGet,
    getAllPreparedVideosGet,
    getOnePreparedVideoGet,
    getPreparedVideoByIdGet,
    getPreparedVideosStatisticsByDaysGet,
    hasPreparedVideoBeenCreatedGet,
    updatePreparedVideoPatch,
} from './prepared-video.controller';

export const PreparedVideosPermissions = {
    Get: 'preparedVideos.get',
    Edit: 'preparedVideos.edit',
} as const;

const router = expressRouter();

// Read endpoints - require organization header and get permission
router.get(
    '/list',
    [authMiddleware, requireOrganizationHeader, checkPermissions(PreparedVideosPermissions.Get)],
    getAllPreparedVideosGet,
);
router.get(
    '/get',
    [authMiddleware, requireOrganizationHeader, checkPermissions(PreparedVideosPermissions.Get)],
    getPreparedVideoByIdGet,
);
router.get(
    '/get-one',
    [authMiddleware, requireOrganizationHeader, checkPermissions(PreparedVideosPermissions.Get)],
    getOnePreparedVideoGet,
);
router.get(
    '/duplicates',
    [authMiddleware, requireOrganizationHeader, checkPermissions(PreparedVideosPermissions.Get)],
    findPreparedVideoDuplicatesGet,
);
router.get(
    '/statistics',
    [authMiddleware, requireOrganizationHeader, checkPermissions(PreparedVideosPermissions.Get)],
    getPreparedVideosStatisticsByDaysGet,
);
router.get(
    '/has-prepared-video-been-created',
    [authMiddleware, requireOrganizationHeader, checkPermissions(PreparedVideosPermissions.Get)],
    hasPreparedVideoBeenCreatedGet,
);

// Write endpoints - require organization header and edit permission
router.post(
    '/create',
    [authMiddleware, requireOrganizationHeader, checkPermissions(PreparedVideosPermissions.Edit)],
    createPreparedVideoPost,
);
router.patch(
    '/update',
    [authMiddleware, requireOrganizationHeader, checkPermissions(PreparedVideosPermissions.Edit)],
    updatePreparedVideoPatch,
);
router.delete(
    '/delete',
    [authMiddleware, requireOrganizationHeader, checkPermissions(PreparedVideosPermissions.Edit)],
    deletePreparedVideoDelete,
);

export default router;
