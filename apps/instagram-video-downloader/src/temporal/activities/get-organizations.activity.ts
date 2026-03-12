// Get Organizations Activity for Temporal Workflow
import {getAllOrganizations} from '#src/db/organization';
import {getDb} from '#src/db/utils';
import {GetOrganizationsActivityResponse} from '#src/types/temporal';

// eslint-disable-next-line valid-jsdoc
/**
 * Get organizations activity - fetches all organizations
 */
export async function getOrganizationsActivity(): Promise<GetOrganizationsActivityResponse> {
    const db = getDb();

    const {result: organizations} = await getAllOrganizations({}, db);

    return {
        success: true,
        organizations,
    };
}
