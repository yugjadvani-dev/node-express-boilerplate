import request from 'supertest';
import { createApp } from '../../../src/app';
import { pool, query } from '../../../src/config/database';
import bcrypt from 'bcryptjs';

const app = createApp();

async function cleanDb() {
  await query(`TRUNCATE TABLE tokens, users RESTART IDENTITY CASCADE`);
}

async function createUserAndLogin(opts: { role?: 'user' | 'admin' } = {}) {
  const role = opts.role ?? 'user';
  const email = `${role}-${Date.now()}@test.com`;
  const password = 'Test@1234!';
  const hash = await bcrypt.hash(password, 4);

  const rows = await query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role, is_email_verified)
     VALUES ($1, $2, $3, $4, true) RETURNING id`,
    [`Test ${role}`, email, hash, role],
  );
  const id = rows[0].id;

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  return {
    id,
    email,
    token: loginRes.body.tokens.access.token as string,
  };
}

describe('User Routes — /api/v1/users', () => {
  beforeAll(async () => { await cleanDb(); });
  afterAll(async () => { await pool.end(); });
  afterEach(async () => { await cleanDb(); });

  // ── GET /me ────────────────────────────────────────────────────────────────
  describe('GET /me', () => {
    it('200 — returns current user profile', async () => {
      const { token, email } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.user.email).toBe(email);
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('401 — rejects unauthenticated request', async () => {
      await request(app).get('/api/v1/users/me').expect(401);
    });
  });

  // ── PATCH /me ──────────────────────────────────────────────────────────────
  describe('PATCH /me', () => {
    it('200 — updates own name', async () => {
      const { token } = await createUserAndLogin();
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.user.name).toBe('Updated Name');
    });
  });

  // ── GET / (admin) ──────────────────────────────────────────────────────────
  describe('GET / — list users', () => {
    it('200 — admin can list users', async () => {
      const { token } = await createUserAndLogin({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.totalResults).toBeGreaterThanOrEqual(1);
    });

    it('403 — regular user cannot list all users', async () => {
      const { token } = await createUserAndLogin({ role: 'user' });
      await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('200 — supports pagination params', async () => {
      const { token } = await createUserAndLogin({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });
  });

  // ── GET /:id ───────────────────────────────────────────────────────────────
  describe('GET /:id', () => {
    it('200 — user can fetch their own record', async () => {
      const { token, id } = await createUserAndLogin();
      const res = await request(app)
        .get(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.user.id).toBe(id);
    });

    it('403 — user cannot fetch another user\'s record', async () => {
      const { token } = await createUserAndLogin();
      const { id: otherId } = await createUserAndLogin();

      await request(app)
        .get(`/api/v1/users/${otherId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('200 — admin can fetch any user', async () => {
      const { token } = await createUserAndLogin({ role: 'admin' });
      const { id: userId } = await createUserAndLogin();

      await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('422 — invalid UUID param returns 422', async () => {
      const { token } = await createUserAndLogin({ role: 'admin' });
      await request(app)
        .get('/api/v1/users/not-a-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(422);
    });
  });

  // ── DELETE /:id ────────────────────────────────────────────────────────────
  describe('DELETE /:id', () => {
    it('204 — admin can delete a user', async () => {
      const { token } = await createUserAndLogin({ role: 'admin' });
      const { id } = await createUserAndLogin();

      await request(app)
        .delete(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('403 — regular user cannot delete', async () => {
      const { token } = await createUserAndLogin({ role: 'user' });
      const { id } = await createUserAndLogin();

      await request(app)
        .delete(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  // ── POST / (admin create) ──────────────────────────────────────────────────
  describe('POST /', () => {
    it('201 — admin can create user', async () => {
      const { token } = await createUserAndLogin({ role: 'admin' });
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New User', email: 'newuser@test.com', password: 'Test@1234!' })
        .expect(201);

      expect(res.body.user.email).toBe('newuser@test.com');
    });
  });
});
