import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

export const rootName = '/cloud-run-scenario-execution';

export const routes = {
    ...baseRoutes, // Provides: create, get, list, update, delete
    // CloudRunScenarioExecution specific routes
    // Note: We only use create, list, and update from baseRoutes
    // The 'get' and 'delete' from baseRoutes are not used by this module
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
