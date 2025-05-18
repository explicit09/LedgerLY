import { config } from 'dotenv';
import { resolve } from 'path';
import { logger } from '../../src/utils/logger';

// Load environment variables from .env file
const envPath = resolve(__dirname, '../../../.env');
config({ path: envPath });

// Set test environment variables if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Configure test environment
const testEnvConfig = {
  // Database
  DB_HOST: process.env.TEST_DB_HOST || 'localhost',
  DB_PORT: process.env.TEST_DB_PORT || '5432',
  DB_USER: process.env.TEST_DB_USER || 'postgres',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD || 'postgres',
  DB_NAME: process.env.TEST_DB_NAME || 'ledgerly_test',
  
  // JWT
  JWT_SECRET: process.env.TEST_JWT_SECRET || 'test-jwt-secret',
  JWT_EXPIRES_IN: process.env.TEST_JWT_EXPIRES_IN || '1h',
  
  // Other test-specific configurations
  NODE_ENV: 'test',
  LOG_LEVEL: process.env.TEST_LOG_LEVEL || 'error',
};

// Apply test environment variables
Object.entries(testEnvConfig).forEach(([key, value]) => {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
});

// Log test environment configuration
logger.info('Test environment configured', {
  nodeEnv: process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbName: process.env.DB_NAME,
});

// Global test setup
beforeAll(async () => {
  // Any global setup code
});

// Global test teardown
afterAll(async () => {
  // Any global cleanup code
});

// Global test timeout (10 seconds)
jest.setTimeout(10000);
