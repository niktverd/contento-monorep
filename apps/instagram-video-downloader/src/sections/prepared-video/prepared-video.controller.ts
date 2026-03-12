import * as preparedVideosService from '../../db/prepared-videos';
import {wrapper} from '../../db/utils';
import {
    CreatePreparedVideoParams,
    CreatePreparedVideoResponse,
    DeletePreparedVideoParams,
    DeletePreparedVideoResponse,
    FindPreparedVideoDuplicatesParams,
    FindPreparedVideoDuplicatesResponse,
    GetAllPreparedVideosParams,
    GetAllPreparedVideosResponse,
    GetOnePreparedVideoParams,
    GetOnePreparedVideoResponse,
    GetPreparedVideoByIdParams,
    GetPreparedVideoByIdResponse,
    HasPreparedVideoBeenCreatedParams,
    HasPreparedVideoBeenCreatedResponse,
    PreparedVideosStatisticsParams,
    PreparedVideosStatisticsResponse,
    UpdatePreparedVideoParams,
    UpdatePreparedVideoResponse,
} from '../../types';
import {
    CreatePreparedVideoParamsSchema,
    DeletePreparedVideoParamsSchema,
    FindPreparedVideoDuplicatesParamsSchema,
    GetAllPreparedVideosParamsSchema,
    GetOnePreparedVideoParamsSchema,
    GetPreparedVideoByIdParamsSchema,
    HasPreparedVideoBeenCreatedParamsSchema,
    PreparedVideosStatisticsParamsSchema,
    UpdatePreparedVideoParamsSchema,
} from '../../types/schemas/handlers/preparedVideo';

export const createPreparedVideoPost = wrapper<
    CreatePreparedVideoParams,
    CreatePreparedVideoResponse
>(preparedVideosService.createPreparedVideo, CreatePreparedVideoParamsSchema, 'POST');

export const getPreparedVideoByIdGet = wrapper<
    GetPreparedVideoByIdParams,
    GetPreparedVideoByIdResponse
>(preparedVideosService.getPreparedVideoById, GetPreparedVideoByIdParamsSchema, 'GET');

export const getAllPreparedVideosGet = wrapper<
    GetAllPreparedVideosParams,
    GetAllPreparedVideosResponse
>(preparedVideosService.getAllPreparedVideos, GetAllPreparedVideosParamsSchema, 'GET');

export const updatePreparedVideoPatch = wrapper<
    UpdatePreparedVideoParams,
    UpdatePreparedVideoResponse
>(preparedVideosService.updatePreparedVideo, UpdatePreparedVideoParamsSchema, 'PATCH');

export const deletePreparedVideoDelete = wrapper<
    DeletePreparedVideoParams,
    DeletePreparedVideoResponse
>(preparedVideosService.deletePreparedVideo, DeletePreparedVideoParamsSchema, 'DELETE');

export const getOnePreparedVideoGet = wrapper<
    GetOnePreparedVideoParams,
    GetOnePreparedVideoResponse
>(preparedVideosService.getOnePreparedVideo, GetOnePreparedVideoParamsSchema, 'GET');

export const findPreparedVideoDuplicatesGet = wrapper<
    FindPreparedVideoDuplicatesParams,
    FindPreparedVideoDuplicatesResponse
>(
    preparedVideosService.findPreparedVideoDuplicates,
    FindPreparedVideoDuplicatesParamsSchema,
    'GET',
);

export const getPreparedVideosStatisticsByDaysGet = wrapper<
    PreparedVideosStatisticsParams,
    PreparedVideosStatisticsResponse
>(
    preparedVideosService.getPreparedVideosStatisticsByDays,
    PreparedVideosStatisticsParamsSchema,
    'GET',
);

export const hasPreparedVideoBeenCreatedGet = wrapper<
    HasPreparedVideoBeenCreatedParams,
    HasPreparedVideoBeenCreatedResponse
>(
    preparedVideosService.hasPreparedVideoBeenCreated,
    HasPreparedVideoBeenCreatedParamsSchema,
    'GET',
);
