// Get Organizations Activity for Temporal Workflow
import {getAllOrganizations} from 'src/database/api/organization';
import {GetOrganizationsActivityResponse} from '#types';
import db from '../database';
import { Context } from '@temporalio/activity';

// eslint-disable-next-line valid-jsdoc
/**
 * Get organizations activity - fetches all organizations
 */
export async function getOrganizationsActivity(): Promise<GetOrganizationsActivityResponse> {
    Context.current().log.info('getOrganizationsActivity-getOrganizationsActivity');
    const {result: organizations} = await getAllOrganizations({}, db);

    return {
        success: true,
        organizations,
    };
}
