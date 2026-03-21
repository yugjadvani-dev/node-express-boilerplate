/**
 * scripts/cleanup-tokens.ts
 *
 * Purges expired and blacklisted tokens from the database.
 * Run on a schedule (e.g. nightly via cron or a queue worker).
 *
 * Usage:
 *   ts-node scripts/cleanup-tokens.ts
 *   # or after build:
 *   node dist/scripts/cleanup-tokens.js
 *
 * Example cron (every night at 2 AM):
 *   0 2 * * * cd /app && node dist/scripts/cleanup-tokens.js >> /var/log/cleanup.log 2>&1
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { pool, query } from '../src/config/database';
import { logger } from '../src/config/logger';

async function cleanup(): Promise<void> {
  logger.info('🧹 Starting token cleanup...');

  // Delete expired tokens
  const expired = await query<{ count: string }>(
    `WITH deleted AS (
      DELETE FROM tokens WHERE expires < NOW() RETURNING id
    ) SELECT COUNT(*) AS count FROM deleted`,
  );
  logger.info(`  ✅ Removed ${expired[0]?.count ?? 0} expired tokens`);

  // Delete blacklisted tokens older than 7 days (they've served their purpose)
  const blacklisted = await query<{ count: string }>(
    `WITH deleted AS (
      DELETE FROM tokens
      WHERE blacklisted = true AND created_at < NOW() - INTERVAL '7 days'
      RETURNING id
    ) SELECT COUNT(*) AS count FROM deleted`,
  );
  logger.info(`  ✅ Removed ${blacklisted[0]?.count ?? 0} stale blacklisted tokens`);

  // Delete expired sessions
  const sessions = await query<{ count: string }>(
    `WITH deleted AS (
      DELETE FROM sessions WHERE expires_at < NOW() RETURNING id
    ) SELECT COUNT(*) AS count FROM deleted`,
  );
  logger.info(`  ✅ Removed ${sessions[0]?.count ?? 0} expired sessions`);

  // Delete old audit logs (keep last 90 days)
  const auditLogs = await query<{ count: string }>(
    `WITH deleted AS (
      DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days' RETURNING id
    ) SELECT COUNT(*) AS count FROM deleted`,
  );
  logger.info(`  ✅ Removed ${auditLogs[0]?.count ?? 0} old audit log entries`);

  await pool.end();
  logger.info('✨ Cleanup complete');
}

cleanup().catch((err) => {
  logger.error({ err }, '❌ Cleanup failed');
  process.exit(1);
});
