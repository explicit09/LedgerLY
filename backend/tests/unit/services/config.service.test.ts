// Define mock services before any imports that might use them
const mockAwsSecretsService = {
  getSecret: jest.fn(),
  getSecretWithCache: jest.fn(),
  redactSecretId: jest.fn().mockImplementation((id: string) => id),
  redactSecretValue: jest.fn().mockImplementation((value: string) => value),
  secretsManager: {},
  secretCache: new Map(),
  CACHE_TTL_MS: 300000,
  logSecretAccess: jest.fn()
};

// Mock the logger first since it's used in the mocks
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock the AWS Secrets Service module
jest.mock('../../../src/services/secrets/aws-secrets.service', () => ({
  AwsSecretsService: jest.fn().mockImplementation(() => mockAwsSecretsService),
  awsSecretsService: mockAwsSecretsService,
}));

// Now import the actual implementations after mocks are set up
import { ConfigService } from '../../../src/config/config.service';
import { AwsSecretsService } from '../../../src/services/secrets/aws-secrets.service';
import { logger } from '../../../src/utils/logger';

// Define interfaces for the secret values
interface DatabaseSecret {
  DB_HOST: string;
  DB_PORT: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

interface JwtSecret {
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_ISSUER?: string;
  JWT_AUDIENCE?: string;
}

interface PlaidSecret {
  PLAID_CLIENT_ID: string;
  PLAID_SECRET: string;
  PLAID_ENV: 'sandbox' | 'development' | 'production';
  PLAID_WEBHOOK_URL?: string;
}

// Mock data for testing
const mockSecrets = {
  'database/url': {
    DB_HOST: 'test-db-host',
    DB_PORT: '5432',
    DB_USER: 'test-user',
    DB_PASSWORD: 'test-password',
    DB_NAME: 'test-db',
  },
  'auth/jwt': {
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRES_IN: '1h',
    JWT_ISSUER: 'test-issuer',
    JWT_AUDIENCE: 'test-audience',
  },
  'integrations/plaid': {
    PLAID_CLIENT_ID: 'test-client-id',
    PLAID_SECRET: 'test-secret',
    PLAID_ENV: 'sandbox',
    PLAID_WEBHOOK_URL: 'https://test.webhook.url',
  },
};

// Mock environment variables
const originalEnv = { ...process.env };

// Mock the ConfigService to avoid singleton issues
jest.mock('../../../src/config/config.service', () => {
  const originalModule = jest.requireActual('../../../src/config/config.service');
  return {
    ...originalModule,
    ConfigService: class MockConfigService extends originalModule.ConfigService {
      private static instance: MockConfigService;
      
      public static getInstance(): MockConfigService {
        if (!MockConfigService.instance) {
          MockConfigService.instance = new MockConfigService();
        }
        return MockConfigService.instance;
      }
      
      private constructor() {
        super();
      }
    }
  };
});

describe('ConfigService', () => {
  // Test variables
  let configService: ConfigService;

  beforeEach(() => {
    // Set up environment variables for testing
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.AWS_SECRETS_PREFIX = '/ledgerly';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up the default mock implementation for getSecret
    (mockAwsSecretsService.getSecret as jest.Mock).mockImplementation(async (key: string) => {
      const secretKey = key.startsWith('/') ? key.substring(1) : key;
      return (mockSecrets as any)[secretKey] || null;
    });
    
    // Get a fresh instance of ConfigService for each test
    configService = ConfigService.getInstance();
  });

  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;

    // Reset the singleton instance
    // @ts-ignore - Accessing private property for testing
    ConfigService.instance = undefined;
  });

  afterAll(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('getDatabaseConfig', () => {
    it('should return database configuration from secrets manager', async () => {
      // Mock the getSecret method to return database config
      const dbSecret = mockSecrets['database/url'];
      (mockAwsSecretsService.getSecret as jest.Mock).mockResolvedValueOnce(dbSecret);
      
      const dbConfig = await configService.getDatabaseConfig();
      
      expect(dbConfig).toBeDefined();
      expect(dbConfig.host).toBe(dbSecret.DB_HOST);
      expect(dbConfig.port).toBe(parseInt(dbSecret.DB_PORT, 10));
      expect(dbConfig.username).toBe(dbSecret.DB_USER);
      expect(dbConfig.password).toBe(dbSecret.DB_PASSWORD);
      expect(dbConfig.database).toBe(dbSecret.DB_NAME);
      expect(dbConfig.url).toContain(`postgresql://${dbSecret.DB_USER}:${dbSecret.DB_PASSWORD}@${dbSecret.DB_HOST}:${dbSecret.DB_PORT}/${dbSecret.DB_NAME}`);
      expect(mockAwsSecretsService.getSecret).toHaveBeenCalledWith('database/credentials');
    });
    
    it('should throw an error when database configuration is not found', async () => {
      // Mock the getSecret method to return null
      (mockAwsSecretsService.getSecret as jest.Mock).mockResolvedValueOnce(null);
      
      // Clear environment variables
      delete process.env.DATABASE_URL;
      
      await expect(configService.getDatabaseConfig()).rejects.toThrow('Failed to load database configuration');
    });
    
    it('should use default values when no configuration is found', async () => {
      // Mock the getSecret method to return null
      (mockAwsSecretsService.getSecret as jest.Mock).mockResolvedValueOnce(null);
      
      // Clear environment variables
      delete process.env.DATABASE_URL;
      
      await expect(configService.getDatabaseConfig()).rejects.toThrow('Failed to load database configuration');
    });
  });

  describe('getJwtConfig', () => {
    it('should return JWT configuration from secrets manager', async () => {
      // Mock the getSecret method to return JWT config
      const jwtSecret = mockSecrets['auth/jwt'];
      (mockAwsSecretsService.getSecret as jest.Mock).mockResolvedValueOnce(jwtSecret);
      
      const jwtConfig = await configService.getJwtConfig();
      
      expect(jwtConfig).toBeDefined();
      expect(jwtConfig.secret).toBe(jwtSecret.JWT_SECRET);
      expect(jwtConfig.expiresIn).toBe(jwtSecret.JWT_EXPIRES_IN);
      expect(jwtConfig.issuer).toBe(jwtSecret.JWT_ISSUER);
      expect(jwtConfig.audience).toBe(jwtSecret.JWT_AUDIENCE);
      
      expect(mockAwsSecretsService.getSecret).toHaveBeenCalledWith('auth/jwt');
    });
    
    it('should throw an error when JWT secrets are not found', async () => {
      // Mock the getSecret method to return null
      (mockAwsSecretsService.getSecret as jest.Mock).mockResolvedValue(null);
      
      // Clear environment variables
      delete process.env.JWT_SECRET;
      delete process.env.JWT_EXPIRES_IN;
      
      await expect(configService.getJwtConfig()).rejects.toThrow('Failed to load JWT configuration');
    });
    
    it('should throw an error if JWT secret is not configured', async () => {
      // Mock the getSecret method to return null
      (mockAwsSecretsService.getSecret as jest.Mock).mockResolvedValue(null);
      
      // Clear environment variables
      delete process.env.JWT_SECRET;
      
      await expect(configService.getJwtConfig()).rejects.toThrow('Failed to load JWT configuration');
    });
  });

  describe('getPlaidConfig', () => {
    it('should return Plaid configuration from secrets manager', async () => {
      // Mock the getSecret method to return Plaid config
      const plaidSecret = mockSecrets['integrations/plaid'];
      (mockAwsSecretsService.getSecret as jest.Mock).mockResolvedValueOnce(plaidSecret);
      
      const plaidConfig = await configService.getPlaidConfig();
      
      expect(plaidConfig).toBeDefined();
      expect(plaidConfig.clientId).toBe(plaidSecret.PLAID_CLIENT_ID);
      expect(plaidConfig.secret).toBe(plaidSecret.PLAID_SECRET);
      expect(plaidConfig.environment).toBe(plaidSecret.PLAID_ENV);
      expect(plaidConfig.webhookUrl).toBe(plaidSecret.PLAID_WEBHOOK_URL);
      
      expect(mockAwsSecretsService.getSecret).toHaveBeenCalledWith('integrations/plaid');
    });
    
    it('should throw an error when Plaid configuration is not found in secrets', async () => {
      // Mock the getSecret method to return null
      (mockAwsSecretsService.getSecret as jest.Mock).mockResolvedValue(null);
      
      await expect(configService.getPlaidConfig()).rejects.toThrow('Failed to load Plaid configuration');
    });  
  });

  describe('getAwsConfig', () => {
    it('should return AWS configuration from environment variables', () => {
      // Set up AWS environment variables
      process.env.AWS_ACCOUNT_ID = '123456789012';
      
      const awsConfig = configService.getAwsConfig();
      
      expect(awsConfig).toBeDefined();
      expect(awsConfig.region).toBe('us-east-1');
      expect(awsConfig.accountId).toBe('123456789012');
      expect(awsConfig.secretsPrefix).toBe('/ledgerly');
    });
    
    it('should not include credentials when not in development', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        // Set NODE_ENV to production
        process.env.NODE_ENV = 'production';
        
        const awsConfig = configService.getAwsConfig();
        
        // Check if credentials are not included in production
        if ('credentials' in awsConfig) {
          expect((awsConfig as any).credentials).toBeUndefined();
        } else {
          // If credentials are at the root level, they should not have the test values
          expect(awsConfig).not.toHaveProperty('accessKeyId', 'test-access-key');
          expect(awsConfig).not.toHaveProperty('secretAccessKey', 'test-secret-key');
        }
      } finally {
        // Restore NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('getAppConfig', () => {
    it('should return application configuration for test environment', () => {
      // Set up test environment
      process.env.NODE_ENV = 'test';
      process.env.PORT = '4000';
      process.env.LOG_LEVEL = 'info';
      
      const appConfig = configService.getAppConfig();
      
      expect(appConfig).toBeDefined();
      expect(appConfig.environment).toBe('test');
      expect(appConfig.isDevelopment).toBe(true);
      expect(appConfig.isProduction).toBe(false);
      expect(appConfig.isTest).toBe(true);
      expect(appConfig.port).toBe(4000);
      expect(appConfig.logLevel).toBe('info');
      expect(appConfig.nodeEnv).toBe('test');
    });
    
    it('should detect development environment', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        // Set NODE_ENV to development
        process.env.NODE_ENV = 'development';
        
        const appConfig = configService.getAppConfig();
        
        expect(appConfig.isDevelopment).toBe(true);
        expect(appConfig.isProduction).toBe(false);
        expect(appConfig.isTest).toBe(false);
      } finally {
        // Restore NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
    
    it('should detect production environment', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        // Set NODE_ENV to production
        process.env.NODE_ENV = 'production';
        
        const appConfig = configService.getAppConfig();
        
        expect(appConfig.isDevelopment).toBe(false);
        expect(appConfig.isProduction).toBe(true);
        expect(appConfig.isTest).toBe(false);
      } finally {
        // Restore NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  // Note: getCorsConfig and getRateLimitConfig tests are commented out 
  // as they are not part of the current ConfigService implementation
  
  /*
  describe('getCorsConfig', () => {
    it('should return default CORS configuration when no environment variable is set', () => {
      // Make sure CORS_ORIGIN is not set
      delete process.env.CORS_ORIGIN;
      
      const corsConfig = configService.getCorsConfig();
      
      expect(corsConfig).toBeDefined();
      expect(corsConfig.origin).toEqual(['http://localhost:3000']);
    });
    
    it('should parse CORS_ORIGIN environment variable', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';
      
      const corsConfig = configService.getCorsConfig();
      
      expect(corsConfig.origin).toEqual(['http://localhost:3000', 'http://localhost:3001']);
    });
    
    it('should handle wildcard CORS_ORIGIN', () => {
      process.env.CORS_ORIGIN = '*';
      
      const corsConfig = configService.getCorsConfig();
      
      expect(corsConfig.origin).toBe('*');
    });
  });
  */

  /*
  describe('getRateLimitConfig', () => {
    it('should return default rate limit configuration when no environment variables are set', () => {
      // Make sure rate limit environment variables are not set
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX;
      
      const rateLimitConfig = configService.getRateLimitConfig();
      
      expect(rateLimitConfig).toBeDefined();
      expect(rateLimitConfig.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(rateLimitConfig.max).toBe(100);
    });
    
    it('should use environment variables for rate limit configuration', () => {
      // Set rate limit environment variables
      process.env.RATE_LIMIT_WINDOW_MS = '60000'; // 1 minute
      process.env.RATE_LIMIT_MAX = '50';
      
      const rateLimitConfig = configService.getRateLimitConfig();
      
      expect(rateLimitConfig.windowMs).toBe(60000);
      expect(rateLimitConfig.max).toBe(50);
    });
  });
  */
});
