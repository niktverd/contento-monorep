import dotenv from 'dotenv';
import { getEnv } from '../utils/common';
import * as prodConfig from './prod';
import * as preprodConfig from './preprod';
import {Knex} from 'knex';

dotenv.config();

const getConnectionConfig = () => {
    // First priority: APP_DATABASE_URL for application database
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    // Second priority: Build APP_DATABASE_URL from individual APP_POSTGRES_* variables
    if (process.env.POSTGRES_PASSWORD) {
        const appEnv = getEnv();
        const config = appEnv === 'production' ? prodConfig.dbConfig : preprodConfig.dbConfig;

        return {
            ...config,
            connection: {
                ...config.connection,
                password: process.env.POSTGRES_PASSWORD,
            },
        } as Knex.Config;
    }

    throw 'Database config missed';
};

export const connectionConfig = getConnectionConfig();
