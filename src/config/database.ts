import { Pool, PoolClient } from 'pg';
import { config } from '@config/index';
import { logger } from '@config/logger';

// ─── Pool Singleton ────────────────────────────────────────────────────────────
const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  min: config.db.pool.min,
  max: config.db.pool.max,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
});

// Log pool events
pool.on('connect', () => logger.debug('New DB connection established'));
pool.on('error', (err) => logger.error({ err }, 'PostgreSQL pool error'));

// ─── Query Helper ──────────────────────────────────────────────────────────────
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  logger.debug({ query: text, duration, rows: result.rowCount }, 'Executed query');
  return result.rows;
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// ─── Transaction Helper ────────────────────────────────────────────────────────
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Health Check ──────────────────────────────────────────────────────────────
export async function checkDBConnection(): Promise<void> {
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
}

export { pool };
