import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/source';

export const routes = {
    ...baseRoutes, // Provides: create, get, list, update, delete
    statistics: '/statistics', // For getSourcesStatisticsByDays endpoint
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
