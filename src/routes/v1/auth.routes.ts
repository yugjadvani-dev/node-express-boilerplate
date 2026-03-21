import { Router } from 'express';
import { authController } from '@controllers/auth.controller';
import { validate } from '@middlewares/validate.middleware';
import { authenticate } from '@middlewares/auth.middleware';
import { authRateLimiter, passwordResetLimiter } from '@middlewares/rateLimiter.middleware';
import { authValidation } from '@validations/auth.validation';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: John Doe }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already registered
 *       422:
 *         description: Validation error
 */
router.post('/register', authRateLimiter, validate(authValidation.register), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authRateLimiter, validate(authValidation.login), authController.login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 *     security: []
 */
router.post('/logout', validate(authValidation.logout), authController.logout);

/**
 * @openapi
 * /auth/refresh-tokens:
 *   post:
 *     summary: Refresh access & refresh tokens
 *     tags: [Auth]
 *     security: []
 */
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Send reset password email
 *     tags: [Auth]
 *     security: []
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(authValidation.forgotPassword),
  authController.forgotPassword,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     security: []
 */
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword,
);

/**
 * @openapi
 * /auth/send-verification-email:
 *   post:
 *     summary: Resend email verification link
 *     tags: [Auth]
 */
router.post('/send-verification-email', authenticate, authController.sendVerificationEmail);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [Auth]
 *     security: []
 */
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);

export default router;
