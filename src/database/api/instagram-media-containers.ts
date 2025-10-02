import {omit} from 'lodash';

import {InstagramMediaContainer} from '../models/InstagramMediaContainer';
import {assertSameOrg, scopeByOrg} from '../utils';

import {ApiFunctionPrototype} from '#types';
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
} from '#types';
import { ThrownError } from 'src/utils/error';

export const createInstagramMediaContainer: ApiFunctionPrototype<
    CreateInstagramMediaContainerParams,
    CreateInstagramMediaContainerResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('createInstagramMediaContainer | Organization ID is required', 400);
    }

    // Validate foreign keys belong to same organization
    if (params.preparedVideoId) {
        await assertSameOrg(db, organizationId, {
            entityName: 'preparedVideo',
            id: params.preparedVideoId,
        });
    }
    if (params.accountId) {
        await assertSameOrg(db, organizationId, {
            entityName: 'account',
            id: params.accountId,
        });
    }

    const preparedVideoPromise = await db.transaction(async (trx) => {
        const preparedVideo = await InstagramMediaContainer.query(trx).insert({
            ...params,
            organizationId,
        });

        return preparedVideo;
    });

    return {
        result: preparedVideoPromise,
        code: 200,
    };
};

export const getInstagramMediaContainerById: ApiFunctionPrototype<
    GetInstagramMediaContainerByIdParams,
    GetInstagramMediaContainerByIdResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('getInstagramMediaContainerById | Organization ID is required', 400);
    }

    const query = InstagramMediaContainer.query(db);
    scopeByOrg(query, organizationId);
    const preparedVideo = await query.findById(params.id);

    if (!preparedVideo) {
        throw new ThrownError('InstagramMediaContainer not found', 404);
    }

    return {
        result: preparedVideo,
        code: 200,
    };
};

export const getAllInstagramMediaContainers: ApiFunctionPrototype<
    GetAllInstagramMediaContainersParams,
    GetAllInstagramMediaContainersResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('getAllInstagramMediaContainers | Organization ID is required', 400);
    }

    const {page = 1, limit = 10, sortBy, sortOrder = 'desc'} = params;
    const query = InstagramMediaContainer.query(db);
    scopeByOrg(query, organizationId);

    if (sortBy) {
        query.orderBy(sortBy, sortOrder as 'asc' | 'desc');
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const result = await query.page(pageNumber - 1, limitNumber);

    return {
        result: {
            mediaContainers: result.results,
            count: result.total,
        },
        code: 200,
    };
};

export const updateInstagramMediaContainer: ApiFunctionPrototype<
    UpdateInstagramMediaContainerParams,
    UpdateInstagramMediaContainerResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('updateInstagramMediaContainer | Organization ID is required', 400);
    }

    const {id, ...updateData} = params;

    // Validate foreign keys if being updated
    if (updateData.preparedVideoId) {
        await assertSameOrg(db, organizationId, {
            entityName: 'preparedVideo',
            id: updateData.preparedVideoId,
        });
    }
    if (updateData.accountId) {
        await assertSameOrg(db, organizationId, {
            entityName: 'account',
            id: updateData.accountId,
        });
    }

    const preparedVideoPromise = await db.transaction(async (t) => {
        const query = InstagramMediaContainer.query(t);
        scopeByOrg(query, organizationId);
        const preparedVideo = await query.patchAndFetchById(id, omit(updateData, 'organizationId'));

        if (!preparedVideo) {
            throw new ThrownError('InstagramMediaContainer not found', 404);
        }

        return preparedVideo;
    });

    return {
        result: preparedVideoPromise,
        code: 200,
    };
};

export const deleteInstagramMediaContainer: ApiFunctionPrototype<
    DeleteInstagramMediaContainerParams,
    DeleteInstagramMediaContainerResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError('deleteInstagramMediaContainer | Organization ID is required', 400);
    }

    const query = InstagramMediaContainer.query(db);
    scopeByOrg(query, organizationId);
    const deletedCount = await query.deleteById(params.id);

    return {
        result: deletedCount,
        code: 200,
    };
};

export const getLimitedInstagramMediaContainers: ApiFunctionPrototype<
    GetLimitedInstagramMediaContainersParams,
    GetLimitedInstagramMediaContainersResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError(
            'getLimitedInstagramMediaContainers | Organization ID is required',
            400,
        );
    }

    const {accountId, limit = 3, notPublished, random, isBlocked = false} = params;
    const query = InstagramMediaContainer.query(db).where('isBlocked', isBlocked);
    scopeByOrg(query, organizationId);

    if (accountId) {
        // Validate accountId belongs to same organization
        await assertSameOrg(db, organizationId, {
            entityName: 'account',
            id: accountId,
        });
        query.where('accountId', accountId);
    }

    if (notPublished) {
        query.where('isPublished', false);
    }

    if (random) {
        query.orderByRaw('RANDOM()');
    }

    const preparedVideo = await query.limit(limit);

    return {
        result: preparedVideo,
        code: 200,
    };
};

export const getInstagramMediaContainersStatisticsByDays: ApiFunctionPrototype<
    InstagramMediaContainersStatisticsParams,
    InstagramMediaContainersStatisticsResponse
> = async (params, db, options = {}) => {
    const {organizationId} = options;
    if (!organizationId) {
        throw new ThrownError(
            'getInstagramMediaContainersStatisticsByDays | Organization ID is required',
            400,
        );
    }

    const {days} = params;
    if (!days.length) {
        return {result: {}, code: 200};
    }

    const query = InstagramMediaContainer.query(db);
    scopeByOrg(query, organizationId);

    const rows = (await query
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
