/**
 * AWS Configuration
 * 
 * This file contains AWS-specific configuration including:
 * - Region settings
 * - Service configurations
 * - Environment-based configurations
 */

import dotenv from 'dotenv';

dotenv.config();

export const AWSConfig = {
  // AWS Region
  region: process.env.AWS_REGION || 'us-east-1',
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Service endpoints (for local development)
  endpoints: {
    secretsManager: process.env.AWS_SECRETS_MANAGER_ENDPOINT,
  },
  
  // Logging configuration
  logging: {
    // Log level for AWS SDK (none, error, warn, info, debug)
    logLevel: process.env.AWS_SDK_LOG_LEVEL || 'warn',
    
    // Whether to log all AWS SDK requests
    logRequests: process.env.LOG_AWS_REQUESTS === 'true',
  },
  
  // Retry configuration
  retry: {
    // Maximum number of retry attempts for failed requests
    maxRetries: 3,
    
    // Base delay between retry attempts (in ms)
    retryDelay: 100,
  },
  
  // Timeout configuration (in ms)
  timeouts: {
    // Timeout for connecting to AWS services
    connect: 5000,
    
    // Timeout for requests to complete
    request: 10000,
  },
  
  // Feature flags
  features: {
    // Whether to enable caching for AWS services
    caching: process.env.AWS_CACHING_ENABLED !== 'false',
    
    // Whether to enable request/response logging
    requestLogging: process.env.AWS_REQUEST_LOGGING === 'true',
  },
} as const;

// Type for AWS configuration
export type AWSConfigType = typeof AWSConfig;
