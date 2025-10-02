import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/users';

export const routes = {
    list: baseRoutes.list,
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
