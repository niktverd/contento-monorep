// Update with your config settings.
require('dotenv').config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

// Priority: APP_DATABASE_URL > APP_POSTGRES_* variables > DATABASE_URL > POSTGRES_CONFIG > defaults
// This supports the new database separation where application uses app_db
const getConnectionConfig = () => {
    // First priority: APP_DATABASE_URL for application database
    if (process.env.APP_DATABASE_URL) {
        return process.env.APP_DATABASE_URL;
    }

    // Second priority: Build APP_DATABASE_URL from individual APP_POSTGRES_* variables
    if (process.env.APP_POSTGRES_PASSWORD) {
        const appUser = process.env.APP_POSTGRES_USER || 'app_user';
        const appHost = process.env.APP_POSTGRES_HOST || 'postgresql';
        const appDb = process.env.APP_POSTGRES_DB || 'app_db';
        const appPassword = process.env.APP_POSTGRES_PASSWORD;
        const appPort = process.env.APP_POSTGRES_PORT || 5432;

        return `postgresql://${appUser}:${appPassword}@${appHost}:${appPort}/${appDb}`;
    }

    // Third priority: DATABASE_URL for backward compatibility
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    // Fourth priority: POSTGRES_CONFIG parsing for backward compatibility
    const {
        host = 'localhost',
        port = 5433,
        user = 'temporal',
        password = 'temporal',
        database = 'temporal',
    } = JSON.parse(process.env.POSTGRES_CONFIG || '{}');

    return {
        host,
        port,
        user,
        password,
        database,
    };
};

// Separate config for test environment using app_db_test database
const getTestConnectionConfig = () => {
    // For tests, use app_db_test database
    if (process.env.APP_POSTGRES_PASSWORD) {
        const appUser = process.env.APP_POSTGRES_USER || 'app_user';
        const appHost = process.env.APP_POSTGRES_HOST || 'localhost';
        const appDb = 'app_db_test'; // Force test database name
        const appPassword = process.env.APP_POSTGRES_PASSWORD;
        const appPort = process.env.APP_POSTGRES_PORT || 5432;

        return `postgresql://${appUser}:${appPassword}@${appHost}:${appPort}/${appDb}`;
    }

    // Fallback to regular config for development tests
    return getConnectionConfig();
};

const connectionConfig = getConnectionConfig();
const testConnectionConfig = getTestConnectionConfig();
module.exports = {
    development: {
        client: 'pg',
        connection:
            typeof connectionConfig === 'string'
                ? connectionConfig
                : {
                      ...connectionConfig,
                      ssl: false,
                  },
        migrations: {
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },

    ['server-production']: {
        client: 'pg',
        connection:
            typeof connectionConfig === 'string'
                ? connectionConfig
                : {
                      ...connectionConfig,
                      ssl: {rejectUnauthorized: false},
                  },
        migrations: {
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
    ['cloud-run']: {
        client: 'pg',
        connection:
            typeof connectionConfig === 'string'
                ? connectionConfig
                : {
                      ...connectionConfig,
                      ssl: {rejectUnauthorized: false},
                  },
        migrations: {
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
        pool: {
            min: 1,
            max: 19,
        },
    },
    test: {
        client: 'pg',
        connection:
            typeof testConnectionConfig === 'string'
                ? testConnectionConfig
                : {
                      ...testConnectionConfig,
                      ssl: false,
                  },
        migrations: {
            directory: './src/db/migrations',
        },
        seeds: {
            directory: './src/db/seeds',
        },
        pool: {
            min: 1,
            max: 20,
        },
    },
};

// Ensure compatibility with NODE_ENV=production expected by knex CLI
// Map 'production' alias to 'server-production' config
module.exports.production = module.exports['server-production'];
