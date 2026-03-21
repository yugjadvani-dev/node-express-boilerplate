import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { AppError } from '@utils/AppError';
import { logger } from '@config/logger';
import { config } from '@config/index';

// ─── 404 Handler ──────────────────────────────────────────────────────────────
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.originalUrl} not found`, httpStatus.NOT_FOUND));
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let errors: unknown[] | undefined;
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    isOperational = err.isOperational;
  }

  // Postgres unique violation
  if ((err as { code?: string }).code === '23505') {
    statusCode = httpStatus.CONFLICT;
    message = 'Duplicate entry';
    isOperational = true;
  }

  // Postgres FK violation
  if ((err as { code?: string }).code === '23503') {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Referenced resource does not exist';
    isOperational = true;
  }

  // Log non-operational errors (bugs) at error level; operational at warn
  if (!isOperational) {
    logger.error({ err, req: { method: req.method, url: req.originalUrl } }, err.message);
  } else {
    logger.warn({ statusCode, message }, 'Operational error');
  }

  const body: Record<string, unknown> = { code: statusCode, message };
  if (errors) body.errors = errors;

  // Only expose stack trace in dev
  if (config.isDev && !isOperational) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
