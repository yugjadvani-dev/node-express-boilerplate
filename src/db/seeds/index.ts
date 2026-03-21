import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { pool, query } from '@config/database';
import { logger } from '@config/logger';
import { config } from '@config/index';

async function seed(): Promise<void> {
  logger.info('🌱 Running seeds...');

  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin@1234!';

  const existing = await query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [adminEmail],
  );

  if (existing.length > 0) {
    logger.info('Admin user already exists, skipping seed.');
  } else {
    const hash = await bcrypt.hash(adminPassword, config.security.bcryptRounds);
    await query(
      `INSERT INTO users (name, email, password_hash, role, is_email_verified)
       VALUES ($1, $2, $3, 'admin', true)`,
      ['Admin', adminEmail, hash],
    );
    logger.info(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
  }

  await pool.end();
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
