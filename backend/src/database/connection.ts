import knex from 'knex';
import config from './knexfile';
import { env } from '../utils/env';

const db = knex(config[env.nodeEnv] ?? config.development);

export default db;
