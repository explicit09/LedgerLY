import { Sequelize } from 'sequelize';
import { DatabaseService } from '../../../src/database/database.service';
import { configService } from '../../../src/config/config.service';
import { logger } from '../../../src/utils/logger';

// Mock the config service
jest.mock('../../../src/config/config.service');

// Mock the logger
describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  
  // Mock database configuration
  const mockDbConfig = {
    url: 'postgresql://user:password@localhost:5432/testdb',
    host: 'localhost',
    port: 5432,
    username: 'user',
    password: 'password',
    database: 'testdb',
  };
  
  // Mock app configuration
  const mockAppConfig = {
    isDevelopment: true,
    isProduction: false,
    isTest: true,
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock implementations
    (configService.getDatabaseConfig as jest.Mock).mockResolvedValue(mockDbConfig);
    (configService.getAppConfig as jest.Mock).mockReturnValue(mockAppConfig);
    
    // Get a new instance for each test
    databaseService = DatabaseService.getInstance();
  });

  afterEach(async () => {
    // Close any open connections
    try {
      await databaseService.disconnect();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize the database connection', async () => {
      // Mock Sequelize constructor
      const mockSequelize = {
        authenticate: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };
      
      // Replace Sequelize with our mock
      const originalSequelize = jest.requireActual('sequelize');
      jest.mock('sequelize', () => {
        return {
          ...originalSequelize,
          Sequelize: jest.fn().mockImplementation(() => mockSequelize)
        };
      });
      
      // Initialize the database
      await databaseService.initialize();
      
      // Verify the database was initialized with the correct config
      expect(configService.getDatabaseConfig).toHaveBeenCalled();
      expect(configService.getAppConfig).toHaveBeenCalled();
      
      // Verify Sequelize was called with the correct parameters
      expect(Sequelize).toHaveBeenCalledWith(mockDbConfig.url, {
        dialect: 'postgres',
        logging: expect.any(Function),
        define: {
          timestamps: true,
          underscored: true,
        },
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });
      
      // Verify authenticate was called
      expect(mockSequelize.authenticate).toHaveBeenCalled();
      
      // Verify the database is marked as initialized
      expect(databaseService.isConnected()).toBe(true);
    });
    
    it('should not reinitialize if already initialized', async () => {
      // Mock authenticate to resolve successfully
      const mockAuthenticate = jest.fn().mockResolvedValue(undefined);
      jest.spyOn(Sequelize.prototype, 'authenticate').mockImplementation(mockAuthenticate);
      
      // First initialization
      await databaseService.initialize();
      
      // Reset the mock to track subsequent calls
      mockAuthenticate.mockClear();
      
      // Second initialization
      await databaseService.initialize();
      
      // Verify authenticate was only called once
      expect(mockAuthenticate).not.toHaveBeenCalled();
    });
    
    it('should handle initialization errors', async () => {
      // Mock authenticate to reject with an error
      const error = new Error('Connection failed');
      jest.spyOn(Sequelize.prototype, 'authenticate').mockRejectedValue(error);
      
      // Verify the error is propagated
      await expect(databaseService.initialize()).rejects.toThrow(error);
      
      // Verify the database is not marked as initialized
      expect(databaseService.isConnected()).toBe(false);
    });
  });
  
  describe('disconnect', () => {
    it('should close the database connection', async () => {
      // Initialize the database
      await databaseService.initialize();
      
      // Close the connection
      await databaseService.disconnect();
      
      // Verify connection is closed
      const isConnected = await databaseService.isConnected();
      expect(isConnected).toBe(false);
    });
    
    it('should not throw if connection is already closed', async () => {
      // Close without initializing first
      await expect(databaseService.disconnect()).resolves.not.toThrow();
    });
  });
  
  describe('getPrismaClient()', () => {
    it('should return Prisma client when initialized', async () => {
      // Initialize the database
      await databaseService.initialize();
      
      // Get the Prisma client
      const prisma = databaseService.getPrismaClient();
      
      // Verify it returns a Prisma client
      expect(prisma).toBeDefined();
    });
    
    it('should throw if not initialized', () => {
      expect(() => databaseService.getPrismaClient()).toThrow('Database not initialized');
    });
  });
  
  describe('isConnected', () => {
    it('should return false when not initialized', () => {
      expect(databaseService.isConnected()).toBe(false);
    });
    
    it('should return true when initialized', async () => {
      await databaseService.initialize();
      expect(databaseService.isConnected()).toBe(true);
    });
  });
});
