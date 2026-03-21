#!/usr/bin/env node

/**
 * Checks DB connection and runs pending migrations.
 * Usage: node scripts/db-setup.js
 */

const { execSync } = require('child_process');
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    await client.query('SELECT 1');
    console.log('✅ Database connection OK\n');
  } catch (err) {
    console.error('❌ Cannot connect to database:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log('🚀 Running migrations...');
  try {
    execSync('npm run db:migrate', { stdio: 'inherit' });
    console.log('\n✅ Migrations complete!');
  } catch {
    console.error('❌ Migration failed');
    process.exit(1);
  }
}

main();
