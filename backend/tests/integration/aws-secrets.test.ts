import { configService } from '../../src/config/config.service';
import { logger } from '../../src/utils/logger';
import { QueryTypes } from 'sequelize';
import { 
  setupIntegrationTest, 
  teardownIntegrationTest,
  generateTestData,
  wait 
} from '../test-utils/integration.setup';

describe('AWS Secrets Manager Integration', () => {
  beforeAll(async () => {
    await setupIntegrationTest();
  });

  afterAll(async () => {
    await teardownIntegrationTest();
  });

  afterEach(async () => {
    // Add any cleanup after each test if needed
  });

  describe('Configuration Service', () => {
    // Test that all required configurations are loaded
    it('should load all required configurations', async () => {
      const configs = await Promise.all([
        configService.getDatabaseConfig(),
        configService.getJwtConfig(),
        configService.getPlaidConfig(),
        configService.getAwsConfig(),
        configService.getAppConfig(),
      ]);

      // Verify all configs are defined
      configs.forEach((config, index) => {
        expect(config).toBeDefined();
        expect(config).not.toBeNull();
        expect(typeof config).toBe('object');
      });

      logger.info('All configurations loaded successfully');
    });

    it('should load database configuration', async () => {
      const dbConfig = await configService.getDatabaseConfig();
      
      expect(dbConfig).toBeDefined();
      expect(dbConfig.host).toBeDefined();
      expect(dbConfig.port).toBeDefined();
      expect(dbConfig.username).toBeDefined();
      expect(dbConfig.password).toBeDefined();
      expect(dbConfig.database).toBeDefined();
      expect(dbConfig.url).toBeDefined();
      
      logger.info('Database configuration loaded successfully', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        username: dbConfig.username,
      });
    });

    it('should load JWT configuration', async () => {
      const jwtConfig = await configService.getJwtConfig();
      
      expect(jwtConfig).toBeDefined();
      expect(jwtConfig.secret).toBeDefined();
      expect(jwtConfig.expiresIn).toBeDefined();
      expect(jwtConfig.issuer).toBeDefined();
      expect(jwtConfig.audience).toBeDefined();
      
      logger.info('JWT configuration loaded successfully', {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        expiresIn: jwtConfig.expiresIn,
      });
    });

    it('should load Plaid configuration', async () => {
      const plaidConfig = await configService.getPlaidConfig();
      
      expect(plaidConfig).toBeDefined();
      expect(plaidConfig.clientId).toBeDefined();
      expect(plaidConfig.secret).toBeDefined();
      expect(plaidConfig.environment).toBeDefined();
      
      logger.info('Plaid configuration loaded successfully', {
        environment: plaidConfig.environment,
        clientId: plaidConfig.clientId ? '***' : 'Not set',
        webhookUrl: plaidConfig.webhookUrl || 'Not set',
      });
    });
  });

  describe('Database Connection', () => {
    it('should connect to the database and execute queries', async () => {
      const { DatabaseService } = await import('../../src/database/index.js');
      const databaseService = DatabaseService.getInstance();
      
      try {
        // Test initialization
        await databaseService.initialize();
        expect(databaseService.isConnected()).toBe(true);
        
        // Test version retrieval
        const prisma = databaseService.getPrismaClient();
        const versionResult = await prisma.$queryRaw<[{ version: string }]>`SELECT version() as version`;
        
        expect(versionResult[0]).toBeDefined();
        expect(versionResult[0].version).toBeDefined();
        
        // Test transaction support
        const result = await databaseService.withTransaction(async (tx) => {
          // Execute a query within transaction
          const result = await tx.$queryRaw<[{ test_value: number }]>`SELECT 1 as test_value`;
          return result[0];
        });
        
        expect(result).toBeDefined();
        expect(result.test_value).toBe(1);
        
        logger.info('Database transaction test successful');
        
        logger.info('Database connection test successful', {
          version: versionResult[0].version
        });
        
        // Clean up
        await databaseService.disconnect();
      } catch (error) {
        logger.error('Database connection test failed', { error });
        throw error;
      }
    });
    
    it('should handle connection errors gracefully', async () => {
      const { DatabaseService } = await import('../../src/database/index.js');
      const databaseService = DatabaseService.getInstance();
      
      // Close any existing connection
      const isConnected = await databaseService.isConnected();
      if (isConnected) {
        await databaseService.disconnect();
      }
      
      // Test with invalid connection details by temporarily modifying environment
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgres://invalid:password@localhost:5432/invalid_db';
      
      try {
        await expect(databaseService.initialize()).rejects.toThrow();
      } finally {
        // Restore original connection URL
        process.env.DATABASE_URL = originalUrl;
        
        // Should be able to connect with correct credentials
        await databaseService.initialize();
        expect(databaseService.isConnected()).toBe(true);
      }
      await databaseService.disconnect();
    });
  });
});
