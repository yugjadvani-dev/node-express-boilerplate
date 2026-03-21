import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';

import { config } from '@config/index';
import { logger } from '@config/logger';
import { swaggerSpec } from '@config/swagger';
import { passport } from '@config/passport';
import { rateLimiter } from '@middlewares/rateLimiter.middleware';
import { notFound, errorHandler } from '@middlewares/error.middleware';
import { requestId } from '@middlewares/requestId.middleware';
import { sanitizeInput } from '@middlewares/security.middleware';
import v1Router from '@routes/v1/index';

export function createApp(): Application {
  const app = express();

  // ── Trust proxy (needed for accurate IP rate limiting behind nginx/ALB) ────
  app.set('trust proxy', 1);

  // ── Request ID ─────────────────────────────────────────────────────────────
  // Must be first — adds X-Request-ID header for tracing across logs
  app.use(requestId);

  // ── Security Headers (Helmet) ───────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // needed for Swagger UI
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,        // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.security.corsOrigin === '*'
        ? '*'
        : config.security.corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
    }),
  );

  // ── Body Parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // ── Compression ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ── HTTP Parameter Pollution Protection ─────────────────────────────────────
  app.use(hpp());

  // ── XSS Input Sanitization ──────────────────────────────────────────────────
  app.use(sanitizeInput);

  // ── HTTP Request Logging ────────────────────────────────────────────────────
  if (!config.isTest) {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => (req as express.Request).id,
        redact: {
          paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
          censor: '[REDACTED]',
        },
        customLogLevel: (_req, res) => {
          if (res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      }),
    );
  }

  // ── Passport JWT ────────────────────────────────────────────────────────────
  app.use(passport.initialize());

  // ── Global Rate Limiting ────────────────────────────────────────────────────
  app.use(rateLimiter);

  // ── API Docs ─────────────────────────────────────────────────────────────────
  // Only available in non-production environments
  if (!config.isProd) {
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customSiteTitle: config.appName,
        swaggerOptions: { persistAuthorization: true },
      }),
    );
    app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
    logger.info(`📖 Swagger UI available at /api-docs`);
  }

  // ── API Routes ───────────────────────────────────────────────────────────────
  app.use(config.apiPrefix, v1Router);

  // ── 404 & Error Handlers ─────────────────────────────────────────────────────
  // Must be last
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
