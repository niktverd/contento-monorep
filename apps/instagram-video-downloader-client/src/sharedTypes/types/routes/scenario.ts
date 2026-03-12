import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/scenario';

export const routes = {
    ...baseRoutes, // Provides: create, get, list, update, delete
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
