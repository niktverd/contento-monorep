import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/account';

export const routes = {
    ...baseRoutes, // Provides: create, get, list, update, delete
    getBySlug: '/get-by-slug', // For getAccountBySlug endpoint
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
