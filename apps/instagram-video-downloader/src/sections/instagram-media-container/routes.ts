import {Router as expressRouter} from 'express';

import {authMiddleware, checkPermissions, requireOrganizationHeader} from '../../middleware';

import {
    createInstagramMediaContainerPost,
    deleteInstagramMediaContainerDelete,
    getAllInstagramMediaContainersGet,
    getInstagramMediaContainerByIdGet,
    getInstagramMediaContainersStatisticsByDaysGet,
    updateInstagramMediaContainerPatch,
} from './instagram-media-container.controller';

export const InstagramMediaContainersPermissions = {
    Get: 'instagramMediaContainers.get',
    Edit: 'instagramMediaContainers.edit',
} as const;

const router = expressRouter();

// Read endpoints - require organization header and get permission
router.get(
    '/list',
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramMediaContainersPermissions.Get),
    ],
    getAllInstagramMediaContainersGet,
);
router.get(
    '/get',
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramMediaContainersPermissions.Get),
    ],
    getInstagramMediaContainerByIdGet,
);
router.get(
    '/statistics',
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramMediaContainersPermissions.Get),
    ],
    getInstagramMediaContainersStatisticsByDaysGet,
);

// Write endpoints - require organization header and edit permission
router.post(
    '/create',
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramMediaContainersPermissions.Edit),
    ],
    createInstagramMediaContainerPost,
);
router.patch(
    '/update',
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramMediaContainersPermissions.Edit),
    ],
    updateInstagramMediaContainerPatch,
);
router.delete(
    '/delete',
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramMediaContainersPermissions.Edit),
    ],
    deleteInstagramMediaContainerDelete,
);

export default router;
