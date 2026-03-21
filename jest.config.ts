import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@validations/(.*)$': '<rootDir>/src/validations/$1',
    '^@app/(.*)$': '<rootDir>/src/types/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/db/**',
    '!src/**/*.d.ts',
  ],
  setupFiles: ['<rootDir>/tests/fixtures/setup.ts'],
  testTimeout: 30000,
  verbose: true,
};

export default config;
