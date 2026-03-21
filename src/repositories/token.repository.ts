import { query, queryOne } from '@config/database';
import { StoredToken, TokenType } from '@models/token.model';

export const tokenRepository = {
  async create(data: Omit<StoredToken, 'id' | 'created_at'>): Promise<StoredToken> {
    const rows = await query<StoredToken>(
      `INSERT INTO tokens (token, user_id, type, expires, blacklisted)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.token, data.user_id, data.type, data.expires, data.blacklisted],
    );
    return rows[0];
  },

  async findOne(token: string, type: TokenType): Promise<StoredToken | null> {
    return queryOne<StoredToken>(
      `SELECT * FROM tokens
       WHERE token = $1 AND type = $2 AND blacklisted = false AND expires > NOW()`,
      [token, type],
    );
  },

  async deleteByUserId(userId: string, type?: TokenType): Promise<void> {
    if (type) {
      await query(`DELETE FROM tokens WHERE user_id = $1 AND type = $2`, [userId, type]);
    } else {
      await query(`DELETE FROM tokens WHERE user_id = $1`, [userId]);
    }
  },

  async blacklist(token: string): Promise<void> {
    await query(`UPDATE tokens SET blacklisted = true WHERE token = $1`, [token]);
  },

  async purgeExpired(): Promise<void> {
    await query(`DELETE FROM tokens WHERE expires < NOW()`);
  },
};
