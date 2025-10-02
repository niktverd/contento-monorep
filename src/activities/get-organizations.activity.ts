// Get Organizations Activity for Temporal Workflow
import {getAllOrganizations} from 'src/database/api/organization';
import {GetOrganizationsActivityResponse} from '#types';
import db from '../database';

// eslint-disable-next-line valid-jsdoc
/**
 * Get organizations activity - fetches all organizations
 */
export async function getOrganizationsActivity(): Promise<GetOrganizationsActivityResponse> {
    const {result: organizations} = await getAllOrganizations({}, db);

    return {
        success: true,
        organizations,
    };
}
