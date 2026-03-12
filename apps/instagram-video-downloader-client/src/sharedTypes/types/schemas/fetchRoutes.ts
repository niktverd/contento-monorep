import {fullRoutes as accountRoutes} from './../../types/routes/account';
import {fullRoutes as cloudRunScenarioExecutionRoutes} from './../../types/routes/cloudRunScenarioExecution';
import {fullRoutes as instagramLocationRoutes} from './../../types/routes/instagramLocation';
import {fullRoutes as instagramMediaContainerRoutes} from './../../types/routes/instagramMediaContainer';
import {fullRoutes as organizationRoutes} from './../../types/routes/organization';
import {fullRoutes as organizationSenderRoutes} from './../../types/routes/organizationSender';
import {fullRoutes as preparedVideoRoutes} from './../../types/routes/preparedVideo';
import {fullRoutes as roleRoutes} from './../../types/routes/role';
import {fullRoutes as scenarioRoutes} from './../../types/routes/scenario';
import {fullRoutes as sourceRoutes} from './../../types/routes/source';
import {fullRoutes as userRoutes} from './../../types/routes/user';

export const fetchRoutes = {
    accounts: accountRoutes,
    cloudRunScenarioExecutions: cloudRunScenarioExecutionRoutes,
    instagramLocations: instagramLocationRoutes,
    instagramMediaContainers: instagramMediaContainerRoutes,
    organizations: organizationRoutes,
    preparedVideos: preparedVideoRoutes,
    roles: roleRoutes,
    scenarios: scenarioRoutes,
    sources: sourceRoutes,
    users: userRoutes,
    organizationSenders: organizationSenderRoutes,
} as const;

type RouteType = typeof fetchRoutes;
type LeafValues<T> = T extends object
    ? T extends Record<string, infer V>
        ? V extends string
            ? V
            : LeafValues<V>
        : never
    : never;

export type FetchRoutesType = LeafValues<RouteType>;
