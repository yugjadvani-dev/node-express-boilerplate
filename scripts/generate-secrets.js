#!/usr/bin/env node

/**
 * Generates cryptographically secure secrets for your .env file.
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

const secrets = {
  JWT_ACCESS_SECRET: crypto.randomBytes(64).toString('hex'),
  JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
};

console.log('\n🔐 Generated Secrets — paste these into your .env file:\n');
for (const [key, value] of Object.entries(secrets)) {
  console.log(`${key}=${value}`);
}
console.log('\n⚠️  Never commit these values to version control!\n');
