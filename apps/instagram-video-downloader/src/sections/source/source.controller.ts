import {
    createSource,
    deleteSource,
    getAllSources,
    getOneSource,
    getSourcesStatisticsByDays,
    updateSource,
} from '../../db/sources';
import {wrapper} from '../../db/utils';
import {
    CreateSourceParams,
    CreateSourceResponse,
    DeleteSourceParams,
    DeleteSourceResponse,
    GetAllSourcesParams,
    GetAllSourcesResponse,
    GetOneSourceParams,
    GetOneSourceResponse,
    SourceStatisticsParams,
    SourceStatisticsResponse,
    UpdateSourceParams,
    UpdateSourceResponse,
} from '../../types';
import {
    CreateSourceParamsSchema,
    DeleteSourceParamsSchema,
    GetAllSourcesParamsSchema,
    GetOneSourceParamsSchema,
    SourceStatisticsParamsSchema,
    UpdateSourceParamsSchema,
} from '../../types/schemas/handlers/source';

export const createSourcePost = wrapper<CreateSourceParams, CreateSourceResponse>(
    createSource,
    CreateSourceParamsSchema,
    'POST',
);

export const getOneSourceGet = wrapper<GetOneSourceParams, GetOneSourceResponse>(
    getOneSource,
    GetOneSourceParamsSchema,
    'GET',
);

export const getAllSourcesGet = wrapper<GetAllSourcesParams, GetAllSourcesResponse>(
    getAllSources,
    GetAllSourcesParamsSchema,
    'GET',
);

export const updateSourcePatch = wrapper<UpdateSourceParams, UpdateSourceResponse>(
    updateSource,
    UpdateSourceParamsSchema,
    'PATCH',
);

export const deleteSourceDelete = wrapper<DeleteSourceParams, DeleteSourceResponse>(
    deleteSource,
    DeleteSourceParamsSchema,
    'DELETE',
);

export const getSourcesStatisticsByDaysGet = wrapper<
    SourceStatisticsParams,
    SourceStatisticsResponse
>(getSourcesStatisticsByDays, SourceStatisticsParamsSchema, 'GET');
