import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/instagram-media-container';

export const routes = {
    ...baseRoutes, // Provides: create, get, list, update, delete
    statistics: '/statistics',
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
