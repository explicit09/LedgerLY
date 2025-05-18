import AWS from 'aws-sdk';
import { AwsSecretsService } from '../../../src/services/secrets/aws-secrets.service';
import { logger } from '../../../src/utils/logger';
import { getSecretId } from '../../../src/services/secrets/secret-config';

// Mock the AWS SDK
jest.mock('aws-sdk', () => {
  const mockGetSecretValue = jest.fn();
  
  return {
    config: {
      update: jest.fn()
    },
    SecretsManager: jest.fn(() => ({
      getSecretValue: mockGetSecretValue,
    })),
    __mockGetSecretValue: mockGetSecretValue,
  };
});

// Mock the logger
jest.mock('../../../src/utils/logger');

// Mock the secret-config module
jest.mock('../../../src/services/secrets/secret-config', () => ({
  getSecretId: jest.fn((name) => `test-env/${name}`),
  isSecretAccessAllowed: jest.fn(() => true),
}));

describe('AwsSecretsService', () => {
  let awsSecretsService: AwsSecretsService;
  let mockGetSecretValue: jest.Mock;
  
  // Mock data
  const mockSecrets = {
    'test-secret': { SecretString: 'test-secret-value' },
    'nested/secret': { SecretString: 'nested-secret-value' },
    'json-secret': { 
      SecretString: JSON.stringify({ key: 'value', number: 123, nested: { prop: 'nested-value' } }) 
    },
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Get the mock function
    mockGetSecretValue = (AWS as any).__mockGetSecretValue;
    
    // Setup default mock implementation
    mockGetSecretValue.mockImplementation((params: any) => {
      const secretKey = params.SecretId.split('/').pop();
      
      if (mockSecrets[secretKey as keyof typeof mockSecrets]) {
        return {
          promise: () => Promise.resolve(mockSecrets[secretKey as keyof typeof mockSecrets])
        };
      }
      
      const error = new Error('Secrets Manager can\'t find the specified secret.');
      error.name = 'ResourceNotFoundException';
      return {
        promise: () => Promise.reject(error)
      };
    });
    
    // Create a new instance of the service for each test
    awsSecretsService = AwsSecretsService.getInstance();
    
    // Clear the singleton instance for testing
    (AwsSecretsService as any).instance = null;
  });
  
  afterEach(() => {
    // Clear the singleton instance after each test
    (AwsSecretsService as any).instance = null;
  });

  describe('getSecret', () => {
    it('should retrieve a secret by name', async () => {
      const secretName = 'test-secret';
      const secretValue = await awsSecretsService.getSecret(secretName);
      
      expect(secretValue).toBe('test-secret-value');
      expect(mockGetSecretValue).toHaveBeenCalledTimes(1);
      expect(mockGetSecretValue).toHaveBeenCalledWith({
        SecretId: getSecretId(secretName)
      });
    });
    
    it('should handle nested secret paths', async () => {
      const secretName = 'nested/secret';
      const secretValue = await awsSecretsService.getSecret(secretName);
      
      expect(secretValue).toBe('nested-secret-value');
      expect(mockGetSecretValue).toHaveBeenCalledWith({
        SecretId: getSecretId(secretName)
      });
    });
    
    it('should return null for non-existent secrets when not required', async () => {
      const secretName = 'non-existent-secret';
      const secretValue = await awsSecretsService.getSecret(secretName, { required: false });
      
      expect(secretValue).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
    
    it('should throw an error for non-existent secrets when required', async () => {
      const secretName = 'non-existent-secret';
      
      await expect(awsSecretsService.getSecret(secretName, { required: true }))
        .rejects
        .toThrow('Secrets Manager can\'t find the specified secret.');
    });
    
    it('should use cached value for subsequent requests', async () => {
      const secretName = 'test-secret';
      
      // First call - should fetch from AWS
      const firstCall = await awsSecretsService.getSecret(secretName);
      expect(firstCall).toBe('test-secret-value');
      expect(mockGetSecretValue).toHaveBeenCalledTimes(1);
      
      // Reset the mock call count
      mockGetSecretValue.mockClear();
      
      // Second call - should use cache
      const secondCall = await awsSecretsService.getSecret(secretName);
      expect(secondCall).toBe('test-secret-value');
      expect(mockGetSecretValue).not.toHaveBeenCalled();
    });
    
    it('should handle JSON secret values', async () => {
      const secretName = 'json-secret';
      const secretValue = await awsSecretsService.getSecret(secretName);
      
      // The service should return the raw string, parsing is up to the caller
      expect(secretValue).toEqual(JSON.stringify({ key: 'value', number: 123, nested: { prop: 'nested-value' } }));
      expect(mockGetSecretValue).toHaveBeenCalledTimes(1);
    });
    
    it('should handle binary secret values', async () => {
      const binaryData = Buffer.from('binary-secret-data');
      
      // Override the mock to return binary data
      mockGetSecretValue.mockImplementationOnce(() => ({
        promise: () => Promise.resolve({
          SecretBinary: binaryData.toString('base64')
        })
      }));
      
      const secretValue = await awsSecretsService.getSecret('binary-secret');
      
      expect(secretValue).toBe(binaryData.toString('base64'));
    });
    
    it('should handle AWS errors gracefully', async () => {
      // Simulate an AWS error
      const error = new Error('AWS error');
      error.name = 'InternalServiceError';
      
      mockGetSecretValue.mockImplementationOnce(() => ({
        promise: () => Promise.reject(error)
      }));
      
      const secretName = 'failing-secret';
      
      await expect(awsSecretsService.getSecret(secretName, { required: true }))
        .rejects
        .toThrow('AWS error');
      
      expect(logger.error).toHaveBeenCalled();
    });
    
    it('should handle access denied errors', async () => {
      // Mock isSecretAccessAllowed to return false
      const originalIsAllowed = require('../../../src/services/secrets/secret-config').isSecretAccessAllowed;
      try {
        require('../../../src/services/secrets/secret-config').isSecretAccessAllowed = jest.fn(() => false);
        
        const secretName = 'unauthorized-secret';
        
        await expect(awsSecretsService.getSecret(secretName, { required: true }))
          .rejects
          .toThrow(`Access to secret '${getSecretId(secretName)}' is not allowed in this environment`);
        
        expect(logger.error).toHaveBeenCalledWith('Unauthorized secret access attempt', {
          secretId: getSecretId(secretName),
          error: expect.any(String),
          environment: expect.any(String)
        });
      } finally {
        // Restore the original implementation
        require('../../../src/services/secrets/secret-config').isSecretAccessAllowed = originalIsAllowed;
      }
    });
  });
});
