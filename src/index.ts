import { createApp } from './app';
import { config } from '@config/index';
import { logger } from '@config/logger';
import { checkDBConnection } from '@config/database';
import { pool } from '@config/database';

const app = createApp();

async function bootstrap(): Promise<void> {
  // ── Verify DB before accepting traffic ─────────────────────────────────────
  await checkDBConnection();
  logger.info('✅ PostgreSQL connected');

  const server = app.listen(config.port, () => {
    logger.info(
      `🚀 ${config.appName} running in ${config.env} mode on port ${config.port}`,
    );
    if (!config.isProd) {
      logger.info(`📖 API Docs: http://localhost:${config.port}/api-docs`);
    }
  });

  // ─── Graceful Shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await pool.end();
      logger.info('DB pool closed');
      process.exit(0);
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ─── Unhandled Errors ──────────────────────────────────────────────────────
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
