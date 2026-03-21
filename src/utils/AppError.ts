import httpStatus from 'http-status';

// ─── AppError ──────────────────────────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown[];

  constructor(
    message: string,
    statusCode: number = httpStatus.INTERNAL_SERVER_ERROR,
    errors?: unknown[],
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Common Errors ─────────────────────────────────────────────────────────────
export const createError = {
  badRequest: (message: string, errors?: unknown[]) =>
    new AppError(message, httpStatus.BAD_REQUEST, errors),

  unauthorized: (message = 'Unauthorized') =>
    new AppError(message, httpStatus.UNAUTHORIZED),

  forbidden: (message = 'Forbidden') =>
    new AppError(message, httpStatus.FORBIDDEN),

  notFound: (resource = 'Resource') =>
    new AppError(`${resource} not found`, httpStatus.NOT_FOUND),

  conflict: (message: string) =>
    new AppError(message, httpStatus.CONFLICT),

  tooMany: (message = 'Too many requests') =>
    new AppError(message, httpStatus.TOO_MANY_REQUESTS),

  internal: (message = 'Internal server error') =>
    new AppError(message, httpStatus.INTERNAL_SERVER_ERROR, undefined, false),
};
