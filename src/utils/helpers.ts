import { Request, Response, NextFunction, RequestHandler } from 'express';

// ─── Async Handler ─────────────────────────────────────────────────────────────
// Wraps async route handlers to auto-catch promise rejections
export const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) =>
    fn(req, res, next).catch(next);

// ─── Pick ──────────────────────────────────────────────────────────────────────
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        acc[key] = obj[key];
      }
      return acc;
    },
    {} as Pick<T, K>,
  );
}

// ─── Paginate Query Builder ────────────────────────────────────────────────────
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    totalResults: total,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Safe Parse Int ────────────────────────────────────────────────────────────
export function safeInt(value: unknown, fallback: number): number {
  const n = parseInt(String(value), 10);
  return isNaN(n) ? fallback : n;
}
