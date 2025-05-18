import { plaidService } from '../src/services/plaid';
import { prisma } from '../src/lib/prisma';
import { encryptionService } from '../src/utils/encryption';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Mock the Plaid client
jest.mock('plaid', () => {
  // Mock CountryCode enum
  const mockCountryCode = {
    Us: 'US',
    Gb: 'GB',
    // Add other country codes as needed
  };

  return {
    Configuration: jest.fn(),
    PlaidApi: jest.fn().mockImplementation(() => ({
      institutionsGetById: jest.fn().mockImplementation(({ institution_id }) => {
        if (institution_id === 'ins_109508') {
          return Promise.resolve({
            data: {
              institution: {
                name: 'Test Bank',
              },
            },
          });
        }
        return Promise.reject(new Error('Institution not found'));
      }),
      linkTokenCreate: jest.fn().mockResolvedValue({
        data: {
          link_token: 'test-link-token',
          expiration: '2025-12-31T23:59:59Z',
          request_id: 'test-request-id',
        },
      }),
    })),
    PlaidEnvironments: {
      sandbox: 'sandbox',
      development: 'development',
      production: 'production',
    },
    CountryCode: mockCountryCode,
  };
});

describe('PlaidService', () => {
  // Test data
  const testUserId = 'test-user-123';
  
  beforeAll(async () => {
    // Ensure we have the required environment variables
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      throw new Error('Plaid client ID and secret must be set in .env for testing');
    }
  });

  describe('createLinkToken', () => {
    it('should create a link token', async () => {
      const linkToken = await plaidService.createLinkToken({
        userId: testUserId,
      });
      
      expect(linkToken).toBeDefined();
      expect(typeof linkToken).toBe('string');
      expect(linkToken.length).toBeGreaterThan(0);
    });
  });

  // Note: The following tests require actual Plaid API calls and may need to be mocked
  // in a real test environment to avoid hitting rate limits
  
  describe('exchangePublicToken', () => {
    // This test requires a valid public token from Plaid Link
    it.skip('should exchange a public token for an access token', async () => {
      // This test is skipped as it requires a real public token
      // To test this, you would need to:
      // 1. Get a real public token from Plaid Link
      // 2. Unskip this test
      // 3. Replace 'test-public-token' with a real token
      const publicToken = 'test-public-token';
      
      const result = await plaidService.exchangePublicToken(publicToken);
      
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.itemId).toBeDefined();
    });
  });



  describe('getInstitution', () => {
    it('should get institution information with a valid ID', async () => {
      const institutionId = 'ins_109508';
      
      const institution = await plaidService.getInstitution(institutionId);
      
      expect(institution).toBeDefined();
      expect(institution.name).toBe('Test Bank');
    });

    it('should throw an error with an invalid institution ID', async () => {
      await expect(
        plaidService.getInstitution('invalid-institution-id')
      ).rejects.toThrow('Institution not found');
    });
  });

  describe('getTransactions', () => {
    // This test requires a valid access token
    it.skip('should get transactions with a valid access token', async () => {
      // This test is skipped as it requires a real access token
      // To test this, you would need to:
      // 1. Get a real access token from Plaid
      // 2. Unskip this test
      // 3. Replace 'test-access-token' with a real token
      const accessToken = 'test-access-token';
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      
      const result = await plaidService.getTransactions({
        accessToken,
        startDate,
        endDate: today,
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.accounts)).toBe(true);
      expect(Array.isArray(result.transactions)).toBe(true);
    });
  });
});
