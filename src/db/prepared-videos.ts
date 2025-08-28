import {omit} from 'lodash';
import {OrderByDirection} from 'objection';

import {PreparedVideo} from './models/PreparedVideo';
import {assertSameOrg, scopeByOrg} from './utils';

import {ApiFunctionPrototype} from '#src/types/common';
import {
    CreatePreparedVideoParamsSchema,
    UpdatePreparedVideoParamsSchema,
} from '#src/types/schemas/handlers/preparedVideo';
import {ThrownError} from '#src/utils/error';
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
    IPreparedVideo,
    PreparedVideosStatisticsParams,
    PreparedVideosStatisticsResponse,
    UpdatePreparedVideoParams,
    UpdatePreparedVideoResponse,
} from '#types';

export const createPreparedVideo: ApiFunctionPrototype<
    CreatePreparedVideoParams,
    CreatePreparedVideoResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const preparedVideoPromise = await db.transaction(async (trx) => {
        const validatedParams = CreatePreparedVideoParamsSchema.parse(params);

        // Validate that foreign keys belong to the same organization
        if (validatedParams.accountId) {
            await assertSameOrg(trx, organizationId, {
                entityName: 'account',
                id: validatedParams.accountId,
            });
        }

        if (validatedParams.sourceId) {
            await assertSameOrg(trx, organizationId, {
                entityName: 'source',
                id: validatedParams.sourceId,
            });
        }

        if (validatedParams.scenarioId) {
            await assertSameOrg(trx, organizationId, {
                entityName: 'scenario',
                id: validatedParams.scenarioId,
            });
        }

        const preparedVideo = await PreparedVideo.query(trx).insert({
            ...validatedParams,
            organizationId,
        });

        return preparedVideo;
    });

    return {
        result: preparedVideoPromise,
        code: 200,
    };
};

export const getPreparedVideoById: ApiFunctionPrototype<
    GetPreparedVideoByIdParams,
    GetPreparedVideoByIdResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const preparedVideo = await scopeByOrg(PreparedVideo.query(db), organizationId).findById(
        params.id,
    );

    if (!preparedVideo) {
        throw new ThrownError('PreparedVideo not found', 404);
    }

    return {
        result: preparedVideo,
        code: 200,
    };
};

export const getAllPreparedVideos: ApiFunctionPrototype<
    GetAllPreparedVideosParams,
    GetAllPreparedVideosResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const {
        page = 1,
        limit = 10,
        sortBy,
        sortOrder = 'desc',
        scenarioIds,
        sourceIds,
        accountIds,
        findDuplicates,
    } = params;

    if (findDuplicates) {
        // Группируем по accountId, sourceId, scenarioId и ищем группы с count > 1
        // Включаем organizationId в группировку для изоляции по организации
        const subquery = scopeByOrg(PreparedVideo.query(db), organizationId)
            .select('accountId', 'sourceId', 'scenarioId')
            .count('* as count')
            .groupBy('accountId', 'sourceId', 'scenarioId')
            .havingRaw('count(*) > 1');

        // page/limit для групп
        const groups = await subquery.page(Number(page) - 1, Number(limit));
        const groupRows = groups.results;
        const groupCount = groups.total;

        // Для каждой группы — получить все видео из этой группы
        let preparedVideos: IPreparedVideo[] = [];
        if (groupRows.length > 0) {
            const orConditions = groupRows.map((g) => {
                return {
                    accountId: g.accountId,
                    sourceId: g.sourceId,
                    scenarioId: g.scenarioId,
                };
            });
            preparedVideos = await scopeByOrg(PreparedVideo.query(db), organizationId).where(
                (builder) => {
                    orConditions.forEach((cond) => {
                        builder.orWhere(cond);
                    });
                },
            );
        }
        return {
            result: {
                preparedVideos,
                count: groupCount,
            },
            code: 200,
        };
    }

    const query = scopeByOrg(PreparedVideo.query(db), organizationId);

    if (sortBy) {
        query.orderBy(sortBy, sortOrder as OrderByDirection);
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (scenarioIds) {
        query.whereIn('scenarioId', scenarioIds);
    }

    if (sourceIds) {
        query.whereIn('sourceId', sourceIds);
    }

    if (accountIds) {
        query.whereIn('accountId', accountIds);
    }

    // Execute the query with pagination
    const result = await query.page(pageNumber - 1, limitNumber); // Objection uses 0-based page indexing

    return {
        result: {
            preparedVideos: result.results,
            count: result.total,
        },
        code: 200,
    };
};

export const updatePreparedVideo: ApiFunctionPrototype<
    UpdatePreparedVideoParams,
    UpdatePreparedVideoResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const {id, ...updateData} = UpdatePreparedVideoParamsSchema.parse(params);

    const preparedVideoPromise = await db.transaction(async (trx) => {
        // Validate that foreign keys belong to the same organization if they're being updated
        if (updateData.accountId) {
            await assertSameOrg(trx, organizationId, {
                entityName: 'account',
                id: updateData.accountId,
            });
        }

        if (updateData.sourceId) {
            await assertSameOrg(trx, organizationId, {
                entityName: 'source',
                id: updateData.sourceId,
            });
        }

        if (updateData.scenarioId) {
            await assertSameOrg(trx, organizationId, {
                entityName: 'scenario',
                id: updateData.scenarioId,
            });
        }

        // First, check if the record exists and belongs to our organization
        const existingVideo = await PreparedVideo.query(trx).where({id, organizationId}).first();

        if (!existingVideo) {
            throw new ThrownError('PreparedVideo not found', 404);
        }

        // Update the record and return the updated version (omit organizationId to prevent mutation)
        const preparedVideo = await PreparedVideo.query(trx).patchAndFetchById(
            id,
            omit(updateData, 'organizationId'),
        );

        return preparedVideo;
    });

    return {
        result: preparedVideoPromise,
        code: 200,
    };
};

export const deletePreparedVideo: ApiFunctionPrototype<
    DeletePreparedVideoParams,
    DeletePreparedVideoResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    // Scope deletion to organization
    const deletedCount = await PreparedVideo.query(db)
        .where({id: params.id, organizationId})
        .delete();

    return {
        result: deletedCount,
        code: 200,
    };
};

export const getOnePreparedVideo: ApiFunctionPrototype<
    GetOnePreparedVideoParams,
    GetOnePreparedVideoResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const {
        hasFirebaseUrl,
        firebaseUrl,
        accountId,
        scenarioId,
        sourceId,
        random,
        notInInstagramMediaContainers,
        fetchGraphAccount,
        fetchGraphScenario,
        fetchGraphSource,
    } = params;

    const query = scopeByOrg(PreparedVideo.query(db), organizationId);

    if (hasFirebaseUrl) {
        query.whereNotNull('firebaseUrl');
    }

    if (firebaseUrl) {
        query.where('firebaseUrl', firebaseUrl);
    }

    if (accountId && scenarioId && sourceId) {
        query
            .where('accountId', accountId)
            .andWhere('scenarioId', scenarioId)
            .andWhere('sourceId', sourceId);
    } else if (accountId) {
        query.where('accountId', accountId);
    }

    if (random) {
        query.orderByRaw('RANDOM()');
    }

    if (notInInstagramMediaContainers) {
        // Scope the subquery to the same organization to respect org boundaries
        query.whereNotIn(
            'id',
            db('instagramMediaContainers')
                .select('preparedVideoId')
                .where('organizationId', organizationId),
        );
    }

    if (fetchGraphAccount) {
        query.withGraphFetched('account');
    }

    if (fetchGraphScenario) {
        query.withGraphFetched('scenario');
    }

    if (fetchGraphSource) {
        query.withGraphFetched('source');
    }

    const preparedVideo = await query.first().withGraphFetched('scenario');

    return {
        result: preparedVideo,
        code: 200,
    };
};

export const findPreparedVideoDuplicates: ApiFunctionPrototype<
    FindPreparedVideoDuplicatesParams,
    FindPreparedVideoDuplicatesResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const {accountId, sourceId, scenarioId} = params;
    // Найти все видео с такими же accountId, sourceId, scenarioId в пределах организации
    const videos = await scopeByOrg(PreparedVideo.query(db), organizationId).where({
        accountId,
        sourceId,
        scenarioId,
    });

    // Если найдено больше одной — это дубликаты
    if (videos.length > 1) {
        return {result: videos, code: 200};
    }

    return {result: [], code: 200};
};

export const getPreparedVideosStatisticsByDays: ApiFunctionPrototype<
    PreparedVideosStatisticsParams,
    PreparedVideosStatisticsResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('Organization ID is required', 400);
    }

    const {days} = params;
    if (!days.length) {
        return {result: {}, code: 200};
    }

    const rows = (await scopeByOrg(PreparedVideo.query(db), organizationId)
        .select(db.raw(`to_char("createdAt", 'YYYY-MM-DD') as day`), db.raw('count(*) as count'))
        .whereIn(db.raw(`to_char("createdAt", 'YYYY-MM-DD')`), days)
        .groupBy('day')) as unknown as Array<{day: string; count: string | number}>;

    const result: Record<string, number> = {};
    for (const row of rows) {
        result[row.day] = Number(row.count);
    }
    for (const day of days) {
        if (!(day in result)) result[day] = 0;
    }
    return {result, code: 200};
};

export const hasPreparedVideoBeenCreated: ApiFunctionPrototype<
    HasPreparedVideoBeenCreatedParams,
    HasPreparedVideoBeenCreatedResponse
> = async (params, db, options = {}) => {
    const {accountId, scenarioId, sourceId} = params;
    const video = await getOnePreparedVideo({accountId, scenarioId, sourceId}, db, options);

    return {result: Boolean(video.result), code: video.code};
};
