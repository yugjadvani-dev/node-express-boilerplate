import * as dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ─── Environment Schema ────────────────────────────────────────────────────────
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  API_PREFIX: z.string().default('/api/v1'),
  APP_NAME: z.string().default('API Boilerplate'),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SSL: z.string().default('false').transform((v) => v === 'true'),
  DB_POOL_MIN: z.string().default('2').transform(Number),
  DB_POOL_MAX: z.string().default('10').transform(Number),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION_MINUTES: z.string().default('15').transform(Number),
  JWT_REFRESH_EXPIRATION_DAYS: z.string().default('30').transform(Number),
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z.string().default('10').transform(Number),
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z.string().default('60').transform(Number),

  // Email
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@app.com'),

  // Security
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Bcrypt
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
});

// Validate and parse
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsedEnv.data;

// ─── Config Object ─────────────────────────────────────────────────────────────
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  appName: env.APP_NAME,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
    },
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpirationMinutes: env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: env.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: env.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },

  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    },
    from: env.EMAIL_FROM,
  },

  security: {
    corsOrigin: env.CORS_ORIGIN,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: env.RATE_LIMIT_MAX,
    bcryptRounds: env.BCRYPT_ROUNDS,
  },

  log: {
    level: env.LOG_LEVEL,
  },
} as const;

export type Config = typeof config;
