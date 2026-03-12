import { TransactionOrKnex } from "objection";
import { ThrownError } from "src/utils/error";

/**
 * Assert that an entity belongs to the expected organization
 * @param dbOrTrx - Database instance or transaction
 * @param organizationId - Expected organization ID
 * @param entity - Entity details with name and ID
 * @returns Promise that resolves if validation passes, throws if not
 */
export const assertSameOrg = async (
    dbOrTrx: TransactionOrKnex,
    organizationId: number,
    entity: {entityName: string; id: number},
): Promise<void> => {
    const {entityName, id} = entity;

    // Map entity names to their table names
    const tableMapping: Record<string, string> = {
        account: 'accounts',
        scenario: 'scenarios',
        source: 'sources',
        preparedVideo: 'preparedVideos',
        instagramMediaContainer: 'instagramMediaContainers',
        cloudRunScenarioExecution: 'cloudRunScenarioExecutions',
    };

    const tableName = tableMapping[entityName];
    if (!tableName) {
        throw new ThrownError(`Unknown entity type: ${entityName}`, 400);
    }

    const record = await dbOrTrx(tableName).select('organizationId').where('id', id).first();

    if (!record) {
        throw new ThrownError(`${entityName} with id ${id} not found`, 404);
    }

    if (record.organizationId !== organizationId) {
        throw new ThrownError(
            `${entityName} with id ${id} does not belong to the specified organization`,
            400,
        );
    }
};

export const scopeByOrg = <T extends {where: (field: string, value: unknown) => T}>(
    query: T,
    organizationId: number,
): T => {
    return query.where('organizationId', organizationId);
};
