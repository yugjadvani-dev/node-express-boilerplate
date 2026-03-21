import { query } from '@config/database';

export interface AuditLogEntry {
  user_id?: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  meta?: Record<string, unknown>;
}

/**
 * Write-only audit log repository.
 * Insert-only — never update or delete audit records.
 */
export const auditRepository = {
  async log(entry: AuditLogEntry): Promise<void> {
    await query(
      `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, meta)
       VALUES ($1, $2, $3::inet, $4, $5)`,
      [
        entry.user_id ?? null,
        entry.action,
        entry.ip_address ?? null,
        entry.user_agent ?? null,
        entry.meta ? JSON.stringify(entry.meta) : null,
      ],
    );
  },

  async findByUser(userId: string, limit = 50): Promise<AuditLogEntry[]> {
    return query<AuditLogEntry>(
      `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
  },
};
