import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, teardownTestDatabase } from './test-utils';

// Set a longer timeout for all tests (30 seconds)
jest.setTimeout(30000);

// Set up the test environment before all tests
beforeAll(async () => {
  // Set the NODE_ENV to test if not already set
  process.env.NODE_ENV = 'test';
  
  // Set test database URL if not already set
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL or TEST_DATABASE_URL environment variable must be set for tests');
  }
  require('dotenv').config({ path: '.env.test' });
  
  // Set up the test database
  await setupTestDatabase();
});

// Clean up after all tests are done
afterAll(async () => {
  await teardownTestDatabase();
});

// Reset the database state between tests
afterEach(async () => {
  // You can add any cleanup code here that should run after each test
  // For example, clearing any test data that was created
  const { cleanupTestData } = require('./test-utils');
  await cleanupTestData();
});

// Mock any external services or modules here
jest.mock('winston', () => ({
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock the encryption service
jest.mock('../../src/utils/encryption', () => ({
  encryptionService: {
    encrypt: jest.fn().mockImplementation((data) => `encrypted_${data}`),
    decrypt: jest.fn().mockImplementation((data) => {
      if (typeof data === 'string' && data.startsWith('encrypted_')) {
        return data.replace('encrypted_', '');
      }
      return data;
    }),
  },
}));
