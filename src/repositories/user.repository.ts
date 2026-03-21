import { query, queryOne } from '@config/database';
import { User, CreateUserDto, UpdateUserDto, PaginateOptions, PaginatedResult } from '@app/index';
import { buildPaginationMeta, safeInt } from '@utils/helpers';

// ─── Allowed Sort Columns (whitelist to prevent SQL injection) ─────────────────
const SORTABLE = ['name', 'email', 'created_at', 'role'] as const;
type SortCol = (typeof SORTABLE)[number];

function toSortCol(col: string | undefined): SortCol {
  return SORTABLE.includes(col as SortCol) ? (col as SortCol) : 'created_at';
}

// ─── Repository ────────────────────────────────────────────────────────────────
export const userRepository = {
  async findById(id: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
  },

  async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()],
    );
  },

  async create(dto: CreateUserDto & { password_hash: string }): Promise<User> {
    const rows = await query<User>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dto.name, dto.email.toLowerCase(), dto.password_hash, dto.role ?? 'user'],
    );
    return rows[0];
  },

  async update(id: string, dto: UpdateUserDto & { password_hash?: string }): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (dto.name !== undefined) { fields.push(`name = $${idx++}`); values.push(dto.name); }
    if (dto.email !== undefined) { fields.push(`email = $${idx++}`); values.push(dto.email.toLowerCase()); }
    if (dto.password_hash !== undefined) { fields.push(`password_hash = $${idx++}`); values.push(dto.password_hash); }
    if (dto.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(dto.is_active); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const rows = await query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async deleteById(id: string): Promise<boolean> {
    const rows = await query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id],
    );
    return rows.length > 0;
  },

  async paginate(opts: PaginateOptions): Promise<PaginatedResult<User>> {
    const page = safeInt(opts.page, 1);
    const limit = Math.min(safeInt(opts.limit, 10), 100);
    const offset = (page - 1) * limit;
    const sortBy = toSortCol(opts.sortBy);
    const sortOrder = opts.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const values: unknown[] = [];
    let whereClause = 'WHERE 1=1';

    if (opts.search) {
      values.push(`%${opts.search}%`);
      whereClause += ` AND (name ILIKE $${values.length} OR email ILIKE $${values.length})`;
    }

    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      values,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    values.push(limit);
    values.push(offset);
    const results = await query<User>(
      `SELECT * FROM users ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );

    return { results, ...buildPaginationMeta(total, page, limit) };
  },

  async setEmailVerified(id: string): Promise<void> {
    await query(
      `UPDATE users SET is_email_verified = true, updated_at = NOW() WHERE id = $1`,
      [id],
    );
  },
};
