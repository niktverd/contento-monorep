// Download Video Activity for Temporal Workflow
import {getAllAccounts} from '#src/db/account';
import {getDb} from '#src/db/utils';
import {GetAccountsActivityResponse} from '#src/types/temporal';
import {logError} from '#utils';

// eslint-disable-next-line valid-jsdoc
/**
 * Download video activity - fetches source data and downloads video to Firebase Storage
 * Based on uploadFileFromUrl logic from src/utils/common.ts
 */
export async function getAccountsActivity(
    organizationId?: number,
): Promise<GetAccountsActivityResponse> {
    const db = getDb();

    if (!organizationId) {
        // If no organization context, return empty accounts array
        // This maintains backward compatibility but logs a warning
        logError(
            'getAccountsActivity called without organization context - returning empty accounts',
        );
        return {
            success: true,
            accounts: [],
        };
    }

    const {result: accounts} = await getAllAccounts(
        {
            onlyEnabled: true,
        },
        db,
        {organizationId},
    );

    return {
        success: true,
        accounts,
    };
}
