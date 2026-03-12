import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/instagram-location';

export const routes = {
    ...baseRoutes, // Provides: create, get, list, update, delete
    get: '/get/:id', // Override to include :id parameter
    update: '/update/:id', // Override to include :id parameter
    delete: '/delete/:id', // Override to include :id parameter
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
