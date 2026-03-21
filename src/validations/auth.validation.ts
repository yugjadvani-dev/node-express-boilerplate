import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const authValidation = {
  register: z.object({
    body: z.object({
      name: z.string().min(2).max(100).trim(),
      email: z.string().email().toLowerCase(),
      password,
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email().toLowerCase(),
      password: z.string().min(1),
    }),
  }),

  logout: z.object({
    body: z.object({
      refreshToken: z.string().min(1),
    }),
  }),

  refreshTokens: z.object({
    body: z.object({
      refreshToken: z.string().min(1),
    }),
  }),

  forgotPassword: z.object({
    body: z.object({
      email: z.string().email().toLowerCase(),
    }),
  }),

  resetPassword: z.object({
    query: z.object({
      token: z.string().min(1),
    }),
    body: z.object({
      password,
    }),
  }),

  verifyEmail: z.object({
    query: z.object({
      token: z.string().min(1),
    }),
  }),
};
