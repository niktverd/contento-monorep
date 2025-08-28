import {
    createInstagramLocation,
    deleteInstagramLocation,
    getAllInstagramLocations,
    getInstagramLocationById,
    updateInstagramLocation,
} from '../../db/instagram-locations';
import {wrapper} from '../../db/utils';
import {
    CreateInstagramLocationParamsSchema,
    DeleteInstagramLocationParamsSchema,
    GetAllInstagramLocationsParamsSchema,
    GetInstagramLocationByIdParamsSchema,
    UpdateInstagramLocationParamsSchema,
} from '../../types/schemas/handlers/instagramLocation';

export const createInstagramLocationPost = wrapper(
    createInstagramLocation,
    CreateInstagramLocationParamsSchema,
    'POST',
);

export const getInstagramLocationGet = wrapper(
    getInstagramLocationById,
    GetInstagramLocationByIdParamsSchema,
    'GET',
);

export const getAllInstagramLocationsGet = wrapper(
    getAllInstagramLocations,
    GetAllInstagramLocationsParamsSchema,
    'GET',
);

export const updateInstagramLocationPatch = wrapper(
    updateInstagramLocation,
    UpdateInstagramLocationParamsSchema,
    'PATCH',
);

export const deleteInstagramLocationDelete = wrapper(
    deleteInstagramLocation,
    DeleteInstagramLocationParamsSchema,
    'DELETE',
);
