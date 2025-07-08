import {Request, Response} from 'express';
import {Knex} from 'knex';
import {TransactionOrKnex} from 'objection';
import {z} from 'zod';

import knexInstance from '#src/config/database';
import {ApiFunctionPrototype} from '#src/types/common';
import {ThrownError} from '#src/utils/error';
import {logDatabaseConnected, logDatabaseSchemaVersion, logError} from '#utils';

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
        logDatabaseConnected(`postgresql://${host}:${port}/${database}`, database);

        // Log schema version
        logDatabaseSchemaVersion(latestMigration);

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

                const {code = 200, result} = await fn(validatedData, getDb());
                res.status(code).json(result);
            } catch (validationError) {
                if (validationError instanceof z.ZodError) {
                    throw new ThrownError(
                        `Validation failed: ${JSON.stringify(validationError.format())}`,
                        400,
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
            });
            if (error instanceof ThrownError) {
                res.status(error.code).json({error: error.message});
            } else {
                res.status(500).json({error: 'Internal server error: ' + String(error)});
            }
        }
    };
};
