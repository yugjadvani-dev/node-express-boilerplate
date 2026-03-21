import { z } from 'zod';
import { roles } from '@config/roles';

const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

const uuidParam = z.object({ id: z.string().uuid('Invalid user ID') });

export const userValidation = {
  createUser: z.object({
    body: z.object({
      name: z.string().min(2).max(100).trim(),
      email: z.string().email().toLowerCase(),
      password,
      role: z.enum(roles).optional(),
    }),
  }),

  getUsers: z.object({
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['ASC', 'DESC']).optional(),
      search: z.string().optional(),
    }),
  }),

  getUser: z.object({ params: uuidParam }),

  updateUser: z.object({
    params: uuidParam,
    body: z
      .object({
        name: z.string().min(2).max(100).trim().optional(),
        email: z.string().email().toLowerCase().optional(),
        password: password.optional(),
        is_active: z.boolean().optional(),
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided',
      }),
  }),

  deleteUser: z.object({ params: uuidParam }),
};
