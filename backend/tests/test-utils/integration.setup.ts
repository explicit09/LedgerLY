import { config } from 'dotenv';
import { resolve } from 'path';
import { logger } from '../../src/utils/logger';

// Load environment variables from .env file
const envPath = resolve(__dirname, '../../../.env');
config({ path: envPath });

/**
 * Setup function for integration tests
 */
export async function setupIntegrationTest() {
  // Verify required environment variables are set
  const requiredEnvVars = [
    'NODE_ENV',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_ACCOUNT_ID',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  logger.info('Integration test setup complete', {
    nodeEnv: process.env.NODE_ENV,
    awsRegion: process.env.AWS_REGION,
  });
}

/**
 * Teardown function for integration tests
 */
export async function teardownIntegrationTest() {
  // Close any open connections or cleanup resources
  logger.info('Integration test teardown complete');
}

/**
 * Helper to generate test data
 */
export function generateTestData(overrides: Record<string, any> = {}) {
  const timestamp = new Date().getTime();
  
  return {
    user: {
      email: `testuser+${timestamp}@example.com`,
      password: 'Test@1234',
      firstName: 'Test',
      lastName: `User-${timestamp}`,
      ...overrides.user,
    },
    // Add other test data generators as needed
  };
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
