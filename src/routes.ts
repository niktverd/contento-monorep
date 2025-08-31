import {Router as expressRouter} from 'express';

import {isSuperAdmin, requireOrganizationHeader} from './middleware';
import accountRoutes from './sections/account/routes';
import choreRoutes from './sections/chore/routes';
import cloudRunScenarioExecutionRoutes from './sections/cloud-run-scenario-execution/routes';
import instagramLocationRoutes from './sections/instagram-location/routes';
import instagramMediaContainerRoutes from './sections/instagram-media-container/routes';
import instagramRoutes from './sections/instagram/routes';
import organizationRoutes from './sections/organization/routes';
import organizationSenderRoutes from './sections/organizationSender/routes';
import preparedVideoRoutes from './sections/prepared-video/routes';
import roleRoutes from './sections/role/routes';
import scenarioRoutes from './sections/scenario/routes';
import sourceRoutes from './sections/source/routes';
import temporalRoutes from './sections/temporal/routes';
import uiRoutes from './sections/ui/routes';
import userRoutes from './sections/users/routes';
import youtubeRoutes from './sections/youtube/routes';
import {rootName as accountRootName} from './types/routes/account';
import {rootName as cloudRunScenarioExecutionRootName} from './types/routes/cloudRunScenarioExecution';
import {rootName as instagramLocationRootName} from './types/routes/instagramLocation';
import {rootName as instagramMediaContainerRootName} from './types/routes/instagramMediaContainer';
import {rootName as organizationRootName} from './types/routes/organization';
import {rootName as organizationSenderRootName} from './types/routes/organizationSender';
import {rootName as preparedVideoRootName} from './types/routes/preparedVideo';
import {rootName as roleRootName} from './types/routes/role';
import {rootName as scenarioRootName} from './types/routes/scenario';
import {rootName as sourceRootName} from './types/routes/source';
import {rootName as temporalRootName} from './types/routes/temporal';
import {rootName as userRootName} from './types/routes/user';

const router = expressRouter();

// Ensure super admin detection runs before organization checks
router.use(isSuperAdmin);

// Public routes (no organization header required)
router.use('/instagram', instagramRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/', choreRoutes);

// Super admin only routes (no organization header required)
router.use(organizationRootName, organizationRoutes);
router.use(organizationSenderRootName, organizationSenderRoutes);
router.use(roleRootName, roleRoutes);
router.use(userRootName, userRoutes);

// Organization-scoped feature modules (require organization header)
router.use(scenarioRootName, requireOrganizationHeader, scenarioRoutes);
router.use(sourceRootName, requireOrganizationHeader, sourceRoutes);
router.use(accountRootName, requireOrganizationHeader, accountRoutes);
router.use(preparedVideoRootName, requireOrganizationHeader, preparedVideoRoutes);
router.use(instagramLocationRootName, requireOrganizationHeader, instagramLocationRoutes);
router.use(
    instagramMediaContainerRootName,
    requireOrganizationHeader,
    instagramMediaContainerRoutes,
);
router.use(
    cloudRunScenarioExecutionRootName,
    requireOrganizationHeader,
    cloudRunScenarioExecutionRoutes,
);

// Temporal routes (require organization header)
router.use(temporalRootName, requireOrganizationHeader, temporalRoutes);

// UI routes (require organization header)
router.use('/ui', requireOrganizationHeader, uiRoutes);

export default router;
