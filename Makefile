.PHONY: help install dev build start test test-unit test-integration test-coverage \
        lint lint-fix format typecheck \
        db-migrate db-migrate-down db-seed db-create \
        docker-dev docker-test docker-build docker-prod \
        secrets clean

# ── Default target ─────────────────────────────────────────────────────────────
help: ## Show this help message
	@echo ''
	@echo '  Node + Express + TypeScript + PostgreSQL Boilerplate'
	@echo ''
	@echo '  Usage: make <target>'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ''

# ── Setup ──────────────────────────────────────────────────────────────────────
install: ## Install dependencies and set up git hooks
	npm install
	npx husky install

secrets: ## Generate cryptographically secure JWT secrets
	node scripts/generate-secrets.js

setup: install secrets ## Full first-time project setup
	cp -n .env.example .env || true
	cp -n .env.test.example .env.test || true
	@echo ''
	@echo '✅ Setup complete! Edit .env with your DB credentials, then run:'
	@echo '   make db-create db-migrate db-seed dev'
	@echo ''

# ── Development ────────────────────────────────────────────────────────────────
dev: ## Start development server with hot-reload
	npm run dev

build: ## Compile TypeScript to dist/
	npm run build

start: ## Start the compiled production server
	npm start

# ── Code Quality ───────────────────────────────────────────────────────────────
lint: ## Run ESLint
	npm run lint

lint-fix: ## Auto-fix ESLint issues
	npm run lint:fix

format: ## Format all files with Prettier
	npm run format

format-check: ## Check formatting without writing
	npm run format:check

typecheck: ## TypeScript type-check (no emit)
	npm run typecheck

check: lint format-check typecheck ## Run all quality checks

# ── Testing ────────────────────────────────────────────────────────────────────
test: ## Run all tests
	npm test

test-unit: ## Run unit tests only (no DB required)
	npm test -- --testPathPattern="tests/unit"

test-integration: ## Run integration tests (DB required)
	npm test -- --testPathPattern="tests/integration"

test-coverage: ## Run tests with coverage report
	npm run test:coverage

test-watch: ## Run tests in watch mode
	npm run test:watch

# ── Database ───────────────────────────────────────────────────────────────────
db-create: ## Create the PostgreSQL database
	@echo "Creating database $(DB_NAME)..."
	psql -U $(DB_USER) -c "CREATE DATABASE $(DB_NAME);" || true

db-migrate: ## Run all pending migrations
	npm run db:migrate

db-migrate-down: ## Roll back the last migration
	npm run db:migrate:down

db-seed: ## Seed default data (admin user)
	npm run db:seed

db-reset: ## Drop and recreate DB, run migrations, seed
	psql -U $(DB_USER) -c "DROP DATABASE IF EXISTS $(DB_NAME);"
	psql -U $(DB_USER) -c "CREATE DATABASE $(DB_NAME);"
	npm run db:migrate
	npm run db:seed

# ── Docker ─────────────────────────────────────────────────────────────────────
docker-dev: ## Start Docker dev stack (api + postgres)
	docker-compose up

docker-dev-bg: ## Start Docker dev stack in background
	docker-compose up -d

docker-test: ## Run tests in isolated Docker environment
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit

docker-build: ## Build production Docker image
	docker build --target production -t api-boilerplate:latest .

docker-down: ## Stop all Docker containers
	docker-compose down

docker-clean: ## Stop containers and remove volumes
	docker-compose down -v

docker-migrate: ## Run migrations inside running Docker container
	docker-compose exec api npm run db:migrate

docker-seed: ## Seed data inside running Docker container
	docker-compose exec api npm run db:seed

# ── Utilities ──────────────────────────────────────────────────────────────────
clean: ## Remove dist/, coverage/, node_modules/
	rm -rf dist coverage node_modules

clean-build: ## Remove only dist/
	rm -rf dist

logs: ## Tail Docker container logs
	docker-compose logs -f api

cleanup-tokens: ## Purge expired tokens and old audit logs
	npm run cleanup:tokens
