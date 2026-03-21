import * as dotenv from 'dotenv';
import path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Set test-specific env overrides
process.env['NODE_ENV'] = 'test';
process.env['DB_NAME'] = process.env['DB_NAME'] || 'api_test';
process.env['JWT_ACCESS_SECRET'] = process.env['JWT_ACCESS_SECRET'] || 'test_access_secret_min_32_chars_xxxx';
process.env['JWT_REFRESH_SECRET'] = process.env['JWT_REFRESH_SECRET'] || 'test_refresh_secret_min_32_chars_xxx';
process.env['LOG_LEVEL'] = 'silent';
