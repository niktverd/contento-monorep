import {
    createInstagramMediaContainer,
    deleteInstagramMediaContainer,
    getAllInstagramMediaContainers,
    getInstagramMediaContainerById,
    getInstagramMediaContainersStatisticsByDays,
    getLimitedInstagramMediaContainers,
    updateInstagramMediaContainer,
} from '../../db/instagram-media-containers';
import {wrapper} from '../../db/utils';
import {
    CreateInstagramMediaContainerParams,
    CreateInstagramMediaContainerResponse,
    DeleteInstagramMediaContainerParams,
    DeleteInstagramMediaContainerResponse,
    GetAllInstagramMediaContainersParams,
    GetAllInstagramMediaContainersResponse,
    GetInstagramMediaContainerByIdParams,
    GetInstagramMediaContainerByIdResponse,
    GetLimitedInstagramMediaContainersParams,
    GetLimitedInstagramMediaContainersResponse,
    InstagramMediaContainersStatisticsParams,
    InstagramMediaContainersStatisticsResponse,
    UpdateInstagramMediaContainerParams,
    UpdateInstagramMediaContainerResponse,
} from '../../types';
import {
    CreateInstagramMediaContainerParamsSchema,
    DeleteInstagramMediaContainerParamsSchema,
    GetAllInstagramMediaContainersParamsSchema,
    GetInstagramMediaContainerByIdParamsSchema,
    GetLimitedInstagramMediaContainersParamsSchema,
    InstagramMediaContainersStatisticsParamsSchema,
    UpdateInstagramMediaContainerParamsSchema,
} from '../../types/schemas/handlers/instagramMediaContainer';

export const createInstagramMediaContainerPost = wrapper<
    CreateInstagramMediaContainerParams,
    CreateInstagramMediaContainerResponse
>(createInstagramMediaContainer, CreateInstagramMediaContainerParamsSchema, 'POST');

export const getInstagramMediaContainerByIdGet = wrapper<
    GetInstagramMediaContainerByIdParams,
    GetInstagramMediaContainerByIdResponse
>(getInstagramMediaContainerById, GetInstagramMediaContainerByIdParamsSchema, 'GET');

export const getAllInstagramMediaContainersGet = wrapper<
    GetAllInstagramMediaContainersParams,
    GetAllInstagramMediaContainersResponse
>(getAllInstagramMediaContainers, GetAllInstagramMediaContainersParamsSchema, 'GET');

export const updateInstagramMediaContainerPatch = wrapper<
    UpdateInstagramMediaContainerParams,
    UpdateInstagramMediaContainerResponse
>(updateInstagramMediaContainer, UpdateInstagramMediaContainerParamsSchema, 'PATCH');

export const deleteInstagramMediaContainerDelete = wrapper<
    DeleteInstagramMediaContainerParams,
    DeleteInstagramMediaContainerResponse
>(deleteInstagramMediaContainer, DeleteInstagramMediaContainerParamsSchema, 'DELETE');

export const getLimitedInstagramMediaContainersGet = wrapper<
    GetLimitedInstagramMediaContainersParams,
    GetLimitedInstagramMediaContainersResponse
>(getLimitedInstagramMediaContainers, GetLimitedInstagramMediaContainersParamsSchema, 'GET');

export const getInstagramMediaContainersStatisticsByDaysGet = wrapper<
    InstagramMediaContainersStatisticsParams,
    InstagramMediaContainersStatisticsResponse
>(
    getInstagramMediaContainersStatisticsByDays,
    InstagramMediaContainersStatisticsParamsSchema,
    'GET',
);
