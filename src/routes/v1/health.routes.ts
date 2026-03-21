import { Router } from 'express';
import { query } from '@config/database';
import { pool } from '@config/database';
import os from 'os';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: API health check
 *     description: Returns API status, uptime, DB connectivity, and memory usage.
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 timestamp: { type: string, format: date-time }
 *                 uptime: { type: number, description: Process uptime in seconds }
 *                 database: { type: string, example: ok }
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used: { type: number }
 *                     total: { type: number }
 *       503:
 *         description: Service unhealthy
 */
router.get('/health', async (_req, res) => {
  let dbStatus = 'ok';

  try {
    await query('SELECT 1');
  } catch {
    dbStatus = 'error';
  }

  const memUsed = process.memoryUsage();
  const healthy = dbStatus === 'ok';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env['npm_package_version'] ?? '1.0.0',
    database: dbStatus,
    pool: {
      total: (pool as { totalCount?: number }).totalCount ?? 0,
      idle: (pool as { idleCount?: number }).idleCount ?? 0,
      waiting: (pool as { waitingCount?: number }).waitingCount ?? 0,
    },
    memory: {
      heapUsedMB: Math.round(memUsed.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsed.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsed.rss / 1024 / 1024),
    },
    system: {
      platform: os.platform(),
      nodeVersion: process.version,
      cpus: os.cpus().length,
    },
  });
});

export default router;
