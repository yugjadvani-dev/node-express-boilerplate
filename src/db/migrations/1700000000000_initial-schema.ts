/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // ─── Enable pgcrypto for gen_random_uuid() ──────────────────────────────────
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  // ─── USERS TABLE ───────────────────────────────────────────────────────────
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
    },
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(255)', notNull: true },
    password_hash: { type: 'text', notNull: true },
    role: {
      type: 'varchar(20)',
      notNull: true,
      default: 'user',
      check: "role IN ('user', 'admin')",
    },
    is_active: { type: 'boolean', notNull: true, default: true },
    is_email_verified: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Unique index on email (case-insensitive)
  pgm.createIndex('users', pgm.func('lower(email)'), { unique: true, name: 'users_email_unique' });
  pgm.createIndex('users', 'role');
  pgm.createIndex('users', 'is_active');

  // ─── TOKENS TABLE ──────────────────────────────────────────────────────────
  pgm.createTable('tokens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
    },
    token: { type: 'text', notNull: true },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'varchar(30)',
      notNull: true,
      check: "type IN ('access','refresh','resetPassword','verifyEmail')",
    },
    expires: { type: 'timestamptz', notNull: true },
    blacklisted: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('tokens', 'token');
  pgm.createIndex('tokens', ['user_id', 'type']);
  pgm.createIndex('tokens', 'expires');

  // ─── updated_at trigger ────────────────────────────────────────────────────
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ language 'plpgsql';

    CREATE TRIGGER set_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('tokens', { cascade: true });
  pgm.dropTable('users', { cascade: true });
  pgm.sql(`DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;`);
}
