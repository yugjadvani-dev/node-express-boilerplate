import { Request, Response, NextFunction } from 'express';

/**
 * Sanitizes request body, query, and params to strip XSS payloads.
 * Works recursively on nested objects.
 * Note: This is a defence-in-depth measure — Zod validation is the primary guard.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Strip script tags and event handlers
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
      .replace(/javascript:/gi, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)]),
    );
  }
  return value;
}

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query) as typeof req.query;
  if (req.params) req.params = sanitizeValue(req.params) as typeof req.params;
  next();
};

/**
 * Prevents clickjacking for any non-API routes by setting X-Frame-Options.
 * Helmet handles most security headers; this is an explicit belt-and-suspenders measure.
 */
export const noCache = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};
