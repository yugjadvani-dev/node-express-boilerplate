import bcrypt from 'bcryptjs';
import { User } from '../../src/types/index';

// ─── User Fixtures ─────────────────────────────────────────────────────────────
export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  name: 'Test User',
  email: 'test@example.com',
  password_hash: bcrypt.hashSync('Test@1234!', 4), // low cost for tests
  role: 'user',
  is_active: true,
  is_email_verified: true,
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

export const makeAdmin = (overrides: Partial<User> = {}): User =>
  makeUser({ role: 'admin', email: 'admin@example.com', ...overrides });

// ─── Register Payloads ─────────────────────────────────────────────────────────
export const registerPayload = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Test@1234!',
};

export const loginPayload = {
  email: registerPayload.email,
  password: registerPayload.password,
};
