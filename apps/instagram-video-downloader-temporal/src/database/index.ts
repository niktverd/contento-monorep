import {Knex, knex} from 'knex';
import {Model} from 'objection';

import {connectionConfig} from '../configs/config';

// Initialize knex
const knexInstance: Knex = knex(connectionConfig);

Model.knex(knexInstance);

export default knexInstance;
