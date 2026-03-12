import {fullRoutes as accountRoutes} from '#src/types/routes/account';
import {fullRoutes as cloudRunScenarioExecutionRoutes} from '#src/types/routes/cloudRunScenarioExecution';
import {fullRoutes as instagramLocationRoutes} from '#src/types/routes/instagramLocation';
import {fullRoutes as instagramMediaContainerRoutes} from '#src/types/routes/instagramMediaContainer';
import {fullRoutes as organizationRoutes} from '#src/types/routes/organization';
import {fullRoutes as organizationSenderRoutes} from '#src/types/routes/organizationSender';
import {fullRoutes as preparedVideoRoutes} from '#src/types/routes/preparedVideo';
import {fullRoutes as roleRoutes} from '#src/types/routes/role';
import {fullRoutes as scenarioRoutes} from '#src/types/routes/scenario';
import {fullRoutes as sourceRoutes} from '#src/types/routes/source';
import {fullRoutes as userRoutes} from '#src/types/routes/user';

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
