import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/role';

export const routes = {
    ...baseRoutes,
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
