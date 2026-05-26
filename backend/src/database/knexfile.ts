import type { Knex } from 'knex';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function ensurePostgresUrl(url: string | undefined): string {
  if (!url) {
    throw new Error('[database] Missing DATABASE_URL for Knex configuration.');
  }

  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error('[database] DATABASE_URL must use the PostgreSQL protocol (postgres:// or postgresql://).');
  }

  return url;
}

function buildConnection(url: string): Knex.Config['connection'] {
  const requiresSsl = /neon\.tech/i.test(url) || /[?&]sslmode=/i.test(url);

  if (!requiresSsl) {
    return url;
  }

  return {
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  };
}

const databaseUrl = ensurePostgresUrl(process.env.DATABASE_URL);
const connection = buildConnection(databaseUrl);

const config: Record<string, Knex.Config> = {
  development: {
    client: 'pg',
    connection,
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './seeds',
      extension: 'ts',
    },
    pool: { min: 2, max: 10 },
  },

  staging: {
    client: 'pg',
    connection,
    migrations: {
      directory: './migrations',
      extension: 'js',
    },
    seeds: {
      directory: './seeds',
      extension: 'js',
    },
    pool: { min: 2, max: 10 },
  },

  production: {
    client: 'pg',
    connection,
    migrations: {
      directory: './migrations',
      extension: 'js',
    },
    seeds: {
      directory: './seeds',
      extension: 'js',
    },
    pool: { min: 2, max: 20 },
  },
};

export default config;
module.exports = config;
