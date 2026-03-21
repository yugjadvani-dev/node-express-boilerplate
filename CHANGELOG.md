# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2024-01-01

### Added
- Initial production-ready boilerplate release
- Express 4 + TypeScript 5 strict-mode setup with full path aliases
- PostgreSQL 16 integration via `pg` pool with `node-pg-migrate`
- JWT authentication with access + refresh token rotation and DB blacklisting
- Role-based access control (admin / user) with permission maps
- Complete auth flow: register, login, logout, refresh, forgot/reset password, email verification
- User CRUD API with paginated list, ownership guards, and admin overrides
- Zod schema validation on all request bodies, query params, and path params
- Helmet, CORS, HPP, rate limiting (global + per-route), body size limits
- XSS input sanitization middleware
- Request ID middleware for distributed tracing
- Pino structured logging with field redaction in production
- Nodemailer email service with HTML templates
- Swagger/OpenAPI 3.0 docs (auto-disabled in production)
- Graceful shutdown handling (SIGTERM, SIGINT, uncaughtException, unhandledRejection)
- Multi-stage Dockerfile with non-root user for production
- Docker Compose for dev (with optional pgAdmin) and isolated test environments
- GitHub Actions CI/CD pipeline: lint → unit tests → integration tests → build → Docker push
- Dependabot configuration for automated dependency updates
- Husky pre-commit hooks with lint-staged and conventional commit enforcement
- Jest unit tests (mocked, no DB) and integration tests (real DB via Supertest)
- Audit log migration and repository
- Sessions migration for multi-device token management
- Token cleanup script for scheduled maintenance
- Makefile with 30+ development commands
- VS Code workspace settings, recommended extensions, and REST client file
- Security policy (SECURITY.md)
- Full README with architecture diagram, quick start, and API reference
