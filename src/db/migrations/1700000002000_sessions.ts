/* eslint-disable @typescript-eslint/naming-convention */

export async function up(pgm) {
  // Add last_login_at to users table
  pgm.addColumns('users', {
    last_login_at: { type: 'timestamptz', notNull: false },
    last_login_ip: { type: 'inet', notNull: false },
  });

  // Sessions table (one per device/token family)
  pgm.createTable('sessions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    token_family: {
      type: 'uuid',
      notNull: true,
      comment: 'Groups refresh token rotations — detect reuse attacks across a family',
    },
    device_info: { type: 'varchar(255)', notNull: false },
    ip_address: { type: 'inet', notNull: false },
    last_used_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    expires_at: { type: 'timestamptz', notNull: true },
    is_revoked: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('sessions', 'user_id');
  pgm.createIndex('sessions', 'token_family', { unique: true });
  pgm.createIndex('sessions', 'expires_at');
  pgm.createIndex('sessions', 'is_revoked');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('sessions', { cascade: true });
  pgm.dropColumns('users', ['last_login_at', 'last_login_ip']);
}
