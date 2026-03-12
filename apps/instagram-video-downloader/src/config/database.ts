import fs from 'fs';

import {Knex, knex} from 'knex';
import {Model} from 'objection';

import knexConfig from '../../knexfile';

import {log} from '#utils';

type Environment = 'development' | 'server-production' | 'cloud-run';
const environment = (process.env.APP_ENV || 'development') as Environment;
const connectionConfig = knexConfig[environment] as Knex.Config;

log('--- DATABASE INITIALIZATION ---');
log(`APP_ENV from process.env: ${process.env.APP_ENV}`);
log(`Selected Environment for Knex: ${environment}`);
log('Final Connection Config for Knex:', JSON.stringify(connectionConfig, null, 2));

try {
    const debugInfo = `
    Timestamp: ${new Date().toISOString()}
    APP_ENV: ${process.env.APP_ENV}
    Selected Environment: ${environment}
    Final Connection Config: ${JSON.stringify(connectionConfig, null, 2)}
    ---
  `;
    fs.writeFileSync('/tmp/db_config.log', debugInfo, {flag: 'a'});
} catch (e) {
    log('Could not write to debug file:', e);
}

// Initialize knex
const knexInstance: Knex = knex(connectionConfig);

// Bind all Models to the knex instance
Model.knex(knexInstance);

export default knexInstance;
