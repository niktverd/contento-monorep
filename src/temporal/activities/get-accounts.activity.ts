// Download Video Activity for Temporal Workflow
import {GetAccountsActivityResponse} from '#src/types/temporal';
import {FetchRoutes} from '#src/utils';
import {fetchGet} from '#src/utils/fetchHelpers';
import {IAccount} from '#types';

// eslint-disable-next-line valid-jsdoc
/**
 * Download video activity - fetches source data and downloads video to Firebase Storage
 * Based on uploadFileFromUrl logic from src/utils/common.ts
 */
export async function getAccountsActivity(): Promise<GetAccountsActivityResponse> {
    const accounts = await fetchGet<IAccount[]>({
        route: FetchRoutes.getAccounts,
        query: {
            onlyEnabled: true,
        },
    });

    return {
        success: true,
        accounts,
    };
}
