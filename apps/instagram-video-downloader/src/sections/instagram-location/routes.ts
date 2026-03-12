import {Router as expressRouter} from 'express';

import {authMiddleware, checkPermissions, requireOrganizationHeader} from '../../middleware';
import {routes} from '../../types/routes/instagramLocation';

import {
    createInstagramLocationPost,
    deleteInstagramLocationDelete,
    getAllInstagramLocationsGet,
    getInstagramLocationGet,
    updateInstagramLocationPatch,
} from './instagram-location.controller';

const {create, list, get, update, delete: deleteRoute} = routes;

export enum InstagramLocationsPermissions {
    Get = 'instagramLocations.get',
    Edit = 'instagramLocations.edit',
}

const router = expressRouter();

// Read endpoints - require organization header and get permission
router.get(
    list,
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramLocationsPermissions.Get),
    ],
    getAllInstagramLocationsGet,
);

router.get(
    get,
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramLocationsPermissions.Get),
    ],
    getInstagramLocationGet,
);

// Write endpoints - require organization header and edit permission
router.post(
    create,
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramLocationsPermissions.Edit),
    ],
    createInstagramLocationPost,
);

router.patch(
    update,
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramLocationsPermissions.Edit),
    ],
    updateInstagramLocationPatch,
);

router.delete(
    deleteRoute,
    [
        authMiddleware,
        requireOrganizationHeader,
        checkPermissions(InstagramLocationsPermissions.Edit),
    ],
    deleteInstagramLocationDelete,
);

export default router;
