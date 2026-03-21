import rateLimit from 'express-rate-limit';
import { config } from '@config/index';
import httpStatus from 'http-status';

// ─── General Rate Limiter ──────────────────────────────────────────────────────
export const rateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests, please try again later',
  },
  skip: () => config.isTest,
});

// ─── Auth Rate Limiter (stricter) ──────────────────────────────────────────────
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many auth attempts, please try again later',
  },
  skip: () => config.isTest,
});

// ─── Password Reset Rate Limiter ───────────────────────────────────────────────
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many password reset requests, please try again later',
  },
  skip: () => config.isTest,
});
