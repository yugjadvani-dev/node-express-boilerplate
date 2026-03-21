# 🚀 Node.js · Express · TypeScript · PostgreSQL — Production Boilerplate

A battle-tested, security-first REST API boilerplate. Clone it, configure two `.env` files, run one command, and your production-ready API is live.

[![CI](https://github.com/your-org/your-repo/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/your-repo/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

| Category | What's included |
|---|---|
| **Language** | TypeScript 5 — strict mode, path aliases, `tsc-alias` |
| **Framework** | Express 4 with async error handling via `catchAsync` |
| **Database** | PostgreSQL 16 via `pg` pool · `node-pg-migrate` · UUID primary keys |
| **Auth** | JWT access + refresh tokens · Passport-JWT · token rotation & blacklisting |
| **Security** | Helmet · CORS · HPP · rate limiting (global + per-route) · body size limits · Zod validation |
| **Email** | Nodemailer · HTML templates · verify email & reset password flows |
| **Docs** | Swagger/OpenAPI 3.0 auto-generated from JSDoc comments |
| **Logging** | Pino structured logging · redacted sensitive fields in prod |
| **Testing** | Jest · Supertest · unit + integration test suites |
| **DX** | ESLint · Prettier · Husky pre-commit · conventional commits · lint-staged |
| **DevOps** | Multi-stage Dockerfile · Docker Compose (dev + test) · GitHub Actions CI/CD |

---

## 📁 Project Structure

```
.
├── .github/
│   ├── workflows/
│   │   └── ci.yml                  # CI: lint → unit tests → integration tests → build → Docker push
│   └── dependabot.yml              # Automated dependency updates
├── .husky/
│   ├── pre-commit                  # Runs lint-staged
│   └── commit-msg                  # Enforces conventional commits
├── scripts/
│   ├── generate-secrets.js         # Generates cryptographically secure JWT secrets
│   └── db-setup.js                 # Checks DB connection and runs migrations
├── src/
│   ├── config/
│   │   ├── index.ts                # ✅ Zod-validated config — fails fast on bad env vars
│   │   ├── database.ts             # pg Pool singleton · query/queryOne/withTransaction helpers
│   │   ├── logger.ts               # Pino logger (pretty in dev, JSON in prod, redacted in prod)
│   │   ├── passport.ts             # Passport JWT strategy
│   │   ├── roles.ts                # Role enum · permission map
│   │   └── swagger.ts              # OpenAPI 3.0 spec builder
│   ├── controllers/
│   │   ├── auth.controller.ts      # register · login · logout · refresh · forgot/reset password · verify email
│   │   └── user.controller.ts      # CRUD · /me · paginated list
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 1700000000000_initial-schema.ts   # users + tokens tables · indexes · updated_at trigger
│   │   └── seeds/
│   │       └── index.ts            # Creates default admin user
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # authenticate · authorize(role) · hasPermission · ownerOrAdmin
│   │   ├── error.middleware.ts     # 404 handler · global error handler (PG error codes handled)
│   │   ├── rateLimiter.middleware.ts  # General · auth (stricter) · password-reset limiters
│   │   └── validate.middleware.ts  # Zod schema validation (body · query · params)
│   ├── models/
│   │   └── token.model.ts          # TokenType enum · TokenPayload · StoredToken interfaces
│   ├── repositories/               # All raw SQL lives here — never in services
│   │   ├── user.repository.ts      # findById · findByEmail · create · update · delete · paginate
│   │   └── token.repository.ts     # create · findOne · deleteByUserId · blacklist · purgeExpired
│   ├── routes/
│   │   └── v1/
│   │       ├── index.ts            # Mounts /health · /auth · /users + JSDoc Swagger tags
│   │       ├── auth.routes.ts      # Auth endpoints with per-route rate limiters
│   │       └── user.routes.ts      # User CRUD with role/ownership guards
│   ├── services/                   # Business logic — no Express types, no SQL
│   │   ├── auth.service.ts         # register · login · logout · refresh · password flows
│   │   ├── token.service.ts        # JWT sign/verify · DB persistence · rotation
│   │   ├── user.service.ts         # User CRUD · email uniqueness · password hashing
│   │   └── email.service.ts        # Nodemailer · HTML email templates
│   ├── types/
│   │   └── index.ts                # User · PublicUser · CreateUserDto · PaginatedResult · AuthTokens
│   ├── utils/
│   │   ├── AppError.ts             # AppError class · createError factory
│   │   └── helpers.ts              # catchAsync · pick · buildPaginationMeta · safeInt
│   ├── validations/
│   │   ├── auth.validation.ts      # Zod schemas: register · login · logout · refresh · forgot · reset
│   │   └── user.validation.ts      # Zod schemas: createUser · getUsers · getUser · updateUser · deleteUser
│   ├── app.ts                      # Express app factory (security stack → middleware → routes → error handlers)
│   └── index.ts                    # Bootstrap: DB check → listen → graceful shutdown
├── tests/
│   ├── fixtures/
│   │   ├── setup.ts                # Jest global setup — loads .env.test
│   │   └── factories.ts            # makeUser · makeAdmin · payload helpers
│   ├── unit/
│   │   ├── services/
│   │   │   ├── auth.service.test.ts
│   │   │   └── user.service.test.ts
│   │   └── utils/
│   │       └── helpers.test.ts
│   └── integration/
│       ├── auth.test.ts            # Full HTTP request/response tests against real DB
│       └── user.test.ts
├── .env.example                    # Template — copy to .env and fill in values
├── .env.test.example               # Template — copy to .env.test for local test runs
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── .dockerignore
├── Dockerfile                      # Multi-stage: development · builder · production (non-root user)
├── docker-compose.yml              # Dev stack: api + postgres + optional pgAdmin
├── docker-compose.test.yml         # Isolated test stack
├── jest.config.ts
├── migrate.config.js               # node-pg-migrate CLI config
├── package.json
└── tsconfig.json                   # Strict mode · path aliases
```

---

## ⚡ Quick Start

### Option A — Docker (zero local setup required)

```bash
# 1. Clone
git clone https://github.com/your-org/your-repo.git
cd your-repo

# 2. Configure environment
cp .env.example .env
node scripts/generate-secrets.js   # paste output into .env

# 3. Start (postgres + api with hot-reload)
docker-compose up

# 4. Run migrations inside the container
docker-compose exec api npm run db:migrate

# 5. Seed the default admin user
docker-compose exec api npm run db:seed
```

API is running at **http://localhost:3000**
Swagger docs at **http://localhost:3000/api-docs**

---

### Option B — Local Development

**Prerequisites:** Node.js ≥ 18, PostgreSQL 16, npm ≥ 9

```bash
# 1. Clone & install
git clone https://github.com/your-org/your-repo.git
cd your-repo
npm install

# 2. Environment
cp .env.example .env
node scripts/generate-secrets.js   # paste JWT secrets into .env
# Edit .env — set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

# 3. Create database
psql -U postgres -c "CREATE DATABASE api_boilerplate;"

# 4. Run migrations
npm run db:migrate

# 5. Seed admin user
npm run db:seed

# 6. Start dev server with hot-reload
npm run dev
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in every value. The app **will not start** if required variables are missing or invalid (Zod validates them at boot).

| Variable | Required | Description |
|---|---|---|
| `DB_HOST` | ✅ | PostgreSQL hostname |
| `DB_NAME` | ✅ | Database name |
| `DB_USER` | ✅ | Database user |
| `DB_PASSWORD` | ✅ | Database password |
| `JWT_ACCESS_SECRET` | ✅ | Min 32 chars — use `node scripts/generate-secrets.js` |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars — must differ from access secret |
| `CORS_ORIGIN` | ✅ | Allowed origin(s), comma-separated or `*` |
| `SMTP_HOST` | ❌ | Email sending (optional, emails fail silently if unset) |

---

## 📡 API Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, get tokens |
| POST | `/logout` | Public | Revoke refresh token |
| POST | `/refresh-tokens` | Public | Rotate access + refresh |
| POST | `/forgot-password` | Public | Send reset email |
| POST | `/reset-password?token=` | Public | Reset with token |
| POST | `/send-verification-email` | 🔒 User | Resend verify email |
| POST | `/verify-email?token=` | Public | Verify email address |

### Users — `/api/v1/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/me` | 🔒 User | Get own profile |
| PATCH | `/me` | 🔒 User | Update own profile |
| GET | `/` | 🔒 Admin | Paginated user list |
| POST | `/` | 🔒 Admin | Create user |
| GET | `/:id` | 🔒 Owner/Admin | Get user by ID |
| PATCH | `/:id` | 🔒 Owner/Admin | Update user |
| DELETE | `/:id` | 🔒 Admin | Delete user |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health` | Public | Health check |
| GET | `/api-docs` | Public | Swagger UI (dev only) |

---

## 🛡️ Security Architecture

```
Request
  │
  ▼
Helmet ──────── Sets 15+ security headers (CSP, HSTS, X-Frame-Options…)
  │
  ▼
CORS ─────────── Whitelist-based origin checking
  │
  ▼
HPP ──────────── HTTP Parameter Pollution prevention
  │
  ▼
Body Parser ──── 10 KB body size limit (prevents large payload attacks)
  │
  ▼
Rate Limiter ─── 100 req / 15 min global · 20 req / 15 min on auth routes
                  5 req / hour on password reset
  │
  ▼
Zod Validation ─ Validates body + query + params; rejects unknown fields
  │
  ▼
Passport JWT ─── Verifies token signature + expiry + type claim
  │
  ▼
Role/Permission ─ Role-based (admin/user) + ownership guard
  │
  ▼
Repository ────── Parameterized queries only (no SQL injection possible)
                  Column whitelist for sort/order
  │
  ▼
Response ──────── password_hash stripped from all responses
                  Stack traces hidden in production
```

**Additional security measures:**
- Refresh tokens stored in DB — can be revoked server-side
- Token blacklisting on logout
- Email enumeration prevention on forgot-password
- bcrypt with configurable rounds (default 12)
- Sensitive fields redacted from logs in production (`Authorization`, `password`, `token`)
- Non-root Docker user in production
- Conventional commit enforcement prevents accidental secret commits

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only (no DB needed)
npm test -- --testPathPattern="tests/unit"

# Integration tests (requires running PostgreSQL)
npm test -- --testPathPattern="tests/integration"

# With coverage report
npm run test:coverage

# Watch mode during development
npm run test:watch

# Full isolated test suite in Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

**Test architecture:**
- **Unit tests** mock all repositories — run instantly with no DB
- **Integration tests** hit a real DB via Supertest — full request/response cycle
- Factories in `tests/fixtures/factories.ts` create test data consistently
- Coverage thresholds: 70% across branches, functions, lines, statements

---

## 🗄️ Database

```bash
# Run all pending migrations
npm run db:migrate

# Roll back last migration
npm run db:migrate:down

# Create a new migration file
npm run db:migrate:create -- --name add-user-avatar

# Seed default data (admin user)
npm run db:seed
```

**Default admin credentials (after seeding):**
- Email: `admin@example.com`
- Password: `Admin@1234!`
- ⚠️ Change these immediately in production!

---

## 🐳 Docker

```bash
# Development (hot-reload, pgAdmin available)
docker-compose up

# Development with pgAdmin UI at http://localhost:5050
docker-compose --profile tools up

# Production build locally
docker build --target production -t my-api .
docker run -p 3000:3000 --env-file .env my-api

# Isolated test run
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Hot-reload dev server via ts-node-dev |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run full test suite |
| `npm run test:coverage` | Tests + coverage report |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format all files |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:migrate:down` | Roll back last migration |
| `npm run db:seed` | Seed default data |
| `npm run docker:dev` | Start Docker dev stack |
| `npm run docker:test` | Run tests in Docker |

---

## 🔄 Adding a New Resource

Follow this pattern to add a new resource (e.g., `Post`):

```
1. src/db/migrations/  → create migration with table + indexes
2. src/models/         → add interface/types
3. src/repositories/   → add repository with parameterized SQL
4. src/services/       → add service with business logic
5. src/controllers/    → add controller using catchAsync
6. src/validations/    → add Zod schemas
7. src/routes/v1/      → add router with JSDoc OpenAPI annotations
8. src/routes/v1/index.ts → mount the new router
9. tests/unit/         → unit test the service
10. tests/integration/ → integration test the HTTP layer
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit using conventional commits: `git commit -m "feat(posts): add create endpoint"`
4. Push and open a Pull Request

Commits that don't follow the conventional format will be **rejected by the pre-commit hook**.

---

## 📄 License

MIT © Your Name
