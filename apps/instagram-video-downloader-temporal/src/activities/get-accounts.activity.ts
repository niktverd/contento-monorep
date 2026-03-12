// Download Video Activity for Temporal Workflow
import {GetAccountsActivityResponse} from '#types';
import db from '../database';
import { getAllAccounts } from 'src/database/api/account';
import { Context } from '@temporalio/activity';

// eslint-disable-next-line valid-jsdoc
/**
 * Download video activity - fetches source data and downloads video to Firebase Storage
 * Based on uploadFileFromUrl logic from src/utils/common.ts
 */
export async function getAccountsActivity(
    organizationId?: number,
): Promise<GetAccountsActivityResponse> {
    if (!organizationId) {
        // If no organization context, return empty accounts array
        // This maintains backward compatibility but logs a warning
        Context.current().log.error(
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
