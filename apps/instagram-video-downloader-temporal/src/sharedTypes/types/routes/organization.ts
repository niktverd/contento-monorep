import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/organization';

export const routes = {
    ...baseRoutes,
    addUserWithRolesToOrganization: '/add-user-with-roles-to-organization',
    deletUserFromOrganization: '/delete-user-from-organization',
    listByUid: '/list-by-uid',
    getSecretForInstagramLinking: '/get-secret-for-instagram-linking',
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
