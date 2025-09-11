import {continueAsNew, proxyActivities, sleep, log as workflowLog} from '@temporalio/workflow';

import type {IPreparedVideo} from '../../types';
import type * as activities from '../activities';

import {IAccount} from '#types';

// Configure activities with appropriate timeouts
const {
    createInstagramContainer: createContainer,
    publishInstagramPost: publishPost,
    getAccountsActivity: getAccounts,
    getRandomPreparedVideForAccountActivity: getRandomPreparedVideo,
    runPublishingActivity: runPublishing,
    getOrganizationsActivity: getOrganizations,
} = proxyActivities<typeof activities>({
    startToCloseTimeout: '10 minutes', // Instagram container creation + publishing
    scheduleToCloseTimeout: '15 minutes',
    heartbeatTimeout: '1 minute',
    retry: {
        initialInterval: '30s',
        maximumInterval: '5m',
        backoffCoefficient: 2,
        maximumAttempts: 3,
    },
});

export async function videoPublishingWorkflow(
    preparedVideo: IPreparedVideo,
    account: IAccount,
): Promise<void> {
    const container = await createContainer({preparedVideo});
    await publishPost({
        mediaContainerId: container.mediaContainerId,
        account: account,
        instagramMediaContainerId: container.instagramMediaContainerId,
    });
}

export async function publishingScheduleWorkflow(): Promise<void> {
    const organizations = await getOrganizations();
    for (const organization of organizations.organizations) {
        const accounts = await getAccounts(organization.id);

        for (const account of accounts.accounts) {
            if (!account.organizationId) {
                continue;
            }

            try {
                const randomPreparedVideo = await getRandomPreparedVideo(
                    account.id,
                    account.organizationId,
                );
                if (!randomPreparedVideo) {
                    continue;
                }

                await runPublishing({
                    preparedVideo: randomPreparedVideo,
                    account,
                });
            } catch (error) {
                workflowLog.error(
                    error?.toString() || `Problem with publishing video account id: ${account.id}`,
                );
            }
        }
    }

    // Wait 30 minutes before next publishing attempt
    await sleep('30m');

    // Continue as new to reset workflow history and prevent it from growing too large
    await continueAsNew();
}
