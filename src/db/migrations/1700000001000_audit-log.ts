/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

/**
 * Audit log table — records security-relevant events such as login attempts,
 * password resets, role changes, and account deactivation.
 * Never delete from this table; rows should only be inserted.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
    },
    user_id: {
      type: 'uuid',
      notNull: false,           // null for unauthenticated events (failed logins)
      references: '"users"',
      onDelete: 'SET NULL',
    },
    action: {
      type: 'varchar(100)',
      notNull: true,
      comment: 'e.g. user.login, user.login_failed, user.password_reset, user.role_changed',
    },
    ip_address: { type: 'inet', notNull: false },
    user_agent: { type: 'text', notNull: false },
    meta: {
      type: 'jsonb',
      notNull: false,
      comment: 'Additional context — never store passwords or tokens here',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('audit_logs', 'user_id');
  pgm.createIndex('audit_logs', 'action');
  pgm.createIndex('audit_logs', 'created_at');
  pgm.createIndex('audit_logs', 'ip_address');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('audit_logs', { cascade: true });
}
