import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/prepared-video';

export const routes = {
    ...baseRoutes, // Provides: create, get, list, update, delete
    duplicates: '/duplicates',
    statistics: '/statistics',
    hasPreparedVideoBeenCreated: '/has-prepared-video-been-created',
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
