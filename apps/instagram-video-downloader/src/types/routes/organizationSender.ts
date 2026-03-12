import {pick} from 'lodash';

import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/organization-senders';

export const routes = {
    ...pick(baseRoutes, 'list', 'delete'),
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
