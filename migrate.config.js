// Migration configuration for node-pg-migrate
// This file is used by the `node-pg-migrate` CLI

require('dotenv').config();

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  migrationsTable: 'pgmigrations',
  dir: 'src/db/migrations',
  direction: 'up',
  count: Infinity,
  ignorePattern: '(.*\\.d\\.ts|\\..*)',
  decamelize: true,
};
