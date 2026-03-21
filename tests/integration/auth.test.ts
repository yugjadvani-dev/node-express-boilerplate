import request from 'supertest';
import { createApp } from '../../../src/app';
import { pool, query } from '../../../src/config/database';
import bcrypt from 'bcryptjs';

const app = createApp();

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function cleanDb() {
  await query(`TRUNCATE TABLE tokens, users RESTART IDENTITY CASCADE`);
}

async function createTestUser(overrides: Partial<{
  name: string; email: string; password: string; role: string; is_email_verified: boolean;
}> = {}) {
  const data = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@1234!',
    role: 'user',
    is_email_verified: true,
    ...overrides,
  };
  const hash = await bcrypt.hash(data.password, 4);
  const rows = await query<{ id: string; email: string }>(
    `INSERT INTO users (name, email, password_hash, role, is_email_verified)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
    [data.name, data.email, hash, data.role, data.is_email_verified],
  );
  return { ...rows[0], password: data.password };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe('Auth Routes — /api/v1/auth', () => {
  beforeAll(async () => { await cleanDb(); });
  afterAll(async () => { await pool.end(); });
  afterEach(async () => { await cleanDb(); });

  // ── POST /register ──────────────────────────────────────────────────────────
  describe('POST /register', () => {
    const payload = { name: 'John Doe', email: 'john@example.com', password: 'Test@1234!' };

    it('201 — registers successfully and returns tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload)
        .expect(201);

      expect(res.body.user.email).toBe(payload.email);
      expect(res.body.user).not.toHaveProperty('password_hash');
      expect(res.body.tokens.access.token).toBeDefined();
      expect(res.body.tokens.refresh.token).toBeDefined();
    });

    it('409 — rejects duplicate email', async () => {
      await createTestUser({ email: payload.email });
      await request(app).post('/api/v1/auth/register').send(payload).expect(409);
    });

    it('422 — rejects weak password', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ ...payload, password: 'weak' })
        .expect(422);
    });

    it('422 — rejects missing fields', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' })
        .expect(422);
    });

    it('422 — rejects invalid email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ ...payload, email: 'not-an-email' })
        .expect(422);
    });
  });

  // ── POST /login ─────────────────────────────────────────────────────────────
  describe('POST /login', () => {
    it('200 — logs in with correct credentials', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect(res.body.tokens.access.token).toBeDefined();
    });

    it('401 — rejects wrong password', async () => {
      const user = await createTestUser();
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'Wrong@1234!' })
        .expect(401);
    });

    it('401 — rejects non-existent user', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'Test@1234!' })
        .expect(401);
    });
  });

  // ── POST /logout ────────────────────────────────────────────────────────────
  describe('POST /logout', () => {
    it('204 — logs out successfully', async () => {
      const user = await createTestUser();
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password });

      await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: loginRes.body.tokens.refresh.token })
        .expect(204);
    });

    it('404 — cannot logout with invalid token', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'invalid-token' })
        .expect(404);
    });
  });

  // ── POST /refresh-tokens ────────────────────────────────────────────────────
  describe('POST /refresh-tokens', () => {
    it('200 — returns new tokens', async () => {
      const user = await createTestUser();
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password });

      const res = await request(app)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken: loginRes.body.tokens.refresh.token })
        .expect(200);

      expect(res.body.tokens.access.token).toBeDefined();
    });
  });

  // ── POST /forgot-password ───────────────────────────────────────────────────
  describe('POST /forgot-password', () => {
    it('200 — always succeeds (prevents email enumeration)', async () => {
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nobody@example.com' })
        .expect(200);
    });
  });
});
