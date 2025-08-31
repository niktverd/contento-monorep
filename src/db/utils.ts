import {Request, Response} from 'express';
import {Knex} from 'knex';
import {TransactionOrKnex} from 'objection';
import {z} from 'zod';

import knexInstance from '#src/config/database';
import {ApiFunctionPrototype} from '#src/types/common';
import {ThrownError} from '#src/utils/error';
import {log, logError} from '#utils';

const db: Knex = knexInstance;

const fakeDb = new Proxy(
    {},
    {
        get() {
            throw new Error('DB not available in cloud-run');
        },
    },
);

export const getDb = () => {
    if (process.env.APP_ENV === 'cloud-run') {
        return fakeDb as TransactionOrKnex;
    }
    return db;
};

// eslint-disable-next-line valid-jsdoc
/**
 * Initialize database connection with logging and schema version check
 */
export const initializeDb = async (): Promise<Knex> => {
    if (process.env.APP_ENV === 'cloud-run') {
        return db;
    }

    try {
        // Test the connection and get schema version
        const connectionOptions = db.client.config.connection as Knex.ConnectionConfig & {
            host: string;
            port: number;
            database: string;
        };

        // Check if migrations table exists and get latest migration
        const migrationsExist = await db.schema.hasTable('knex_migrations');
        let latestMigration = 'No migrations applied';

        if (migrationsExist) {
            const result = await db('knex_migrations')
                .select('name')
                .orderBy('batch', 'desc')
                .orderBy('id', 'desc')
                .first();
            latestMigration = result?.name || 'No migrations found';
        }

        // Log successful connection
        const {host = 'localhost', port = 5432, database = 'unknown'} = connectionOptions;
        log(`postgresql://${host}:${port}/${database}`, database);

        // Log schema version
        log(latestMigration);

        return db;
    } catch (error) {
        logError('Failed to initialize database connection:', error);
        throw error;
    }
};

export {db};

// REST HTTP method type
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

// Enhanced wrapper for route handlers with validation and method checking
export const wrapper = <RequestArgs, ResponseArgs>(
    fn: ApiFunctionPrototype<RequestArgs, ResponseArgs>,
    validator: z.ZodType<RequestArgs>,
    allowedMethod?: HttpMethod | HttpMethod[],
) => {
    return async (req: Request, res: Response) => {
        try {
            // Check HTTP method if specified
            if (allowedMethod) {
                const methods = Array.isArray(allowedMethod) ? allowedMethod : [allowedMethod];
                if (!methods.includes(req.method as HttpMethod)) {
                    throw new ThrownError(
                        `Method ${req.method} not allowed. Allowed methods: ${methods.join(', ')}`,
                        405,
                    );
                }
            }

            // Validate request using Zod schema based on HTTP method
            try {
                // Use query params for GET and DELETE, body for POST and PUT
                const dataToValidate = ['GET', 'DELETE'].includes(req.method)
                    ? req.query
                    : req.body;

                if (dataToValidate.id) {
                    dataToValidate.id = Number(dataToValidate.id);
                }

                const validatedData = validator.parse(dataToValidate) as RequestArgs;

                const localsUser = res.locals.user as unknown as
                    | {
                          uid?: string;
                          email?: string;
                          name?: string;
                          id?: number;
                      }
                    | undefined;
                const userArg =
                    localsUser &&
                    typeof localsUser.id === 'number' &&
                    typeof localsUser.uid === 'string' &&
                    typeof localsUser.email === 'string' &&
                    typeof localsUser.name === 'string'
                        ? {
                              id: localsUser.id,
                              uid: localsUser.uid,
                              email: localsUser.email,
                              name: localsUser.name,
                          }
                        : undefined;

                const {code = 200, result} = await fn(validatedData, getDb(), {
                    user: userArg,
                    organizationId: res.locals.organizationId,
                });
                res.status(code).json(result);
            } catch (validationError) {
                if (validationError instanceof z.ZodError) {
                    throw new ThrownError(
                        `Validation failed: ${JSON.stringify(validationError.format())}`,
                        477,
                    );
                }

                throw validationError;
            }
        } catch (error) {
            logError('Error in wrapper (ThrownError):', String(error), {
                reqPath: req.path,
                reqMethod: req.method,
                reqQuery: req.query,
                reqBody: req.body,
                functionName: (error as ThrownError)?.name,
                errorCode: (error as ThrownError)?.code,
            });
            if (error instanceof ThrownError) {
                res.status(error.code).json({error: error.message});
            } else {
                res.status(500).json({error: 'Unexpected error occurred'});
            }
        }
    };
};

/**
 * Add organization scope constraint to a query
 * @param query - The Knex query builder to scope
 * @param organizationId - The organization ID to filter by
 * @returns The scoped query builder
 */
export const scopeByOrg = <T extends {where: (field: string, value: unknown) => T}>(
    query: T,
    organizationId: number,
): T => {
    return query.where('organizationId', organizationId);
};

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
