import { Role } from '@config/roles';

// ─── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export type PublicUser = Omit<User, 'password_hash'>;

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
}

// ─── Pagination ────────────────────────────────────────────────────────────────
export interface PaginateOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface PaginatedResult<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: { token: string; expires: Date };
  refresh: { token: string; expires: Date };
}

// ─── Request Extensions ────────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
