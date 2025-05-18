import { createEncryptionMiddleware } from '../prisma-encryption';
import { Encryption } from '../encryption';

// Mock the encryption module
jest.mock('../encryption', () => ({
  Encryption: {
    encrypt: jest.fn((data: string) => ({ encrypted: data })),
    decrypt: jest.fn((data: { encrypted: string }) => data.encrypted),
  },
}));

describe('Prisma Encryption Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ENCRYPTION_KEY = 'test-key';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should encrypt sensitive fields on create', async () => {
    const middleware = createEncryptionMiddleware();
    const next = jest.fn().mockResolvedValue({ id: 1, plaidAccessToken: 'encrypted-token' });

    const params = {
      model: 'BankConnection',
      action: 'create',
      args: {
        data: {
          id: 1,
          plaidAccessToken: 'secret-token',
        },
      },
    };

    await middleware(params, next);

    expect(next).toHaveBeenCalledWith({
      ...params,
      args: {
        data: {
          id: 1,
          plaidAccessToken: JSON.stringify({ encrypted: 'secret-token' }),
        },
      },
    });
  });

  it('should decrypt sensitive fields in the result', async () => {
    const middleware = createEncryptionMiddleware();
    const next = jest.fn().mockResolvedValue({
      id: 1,
      plaidAccessToken: JSON.stringify({ encrypted: 'secret-token' }),
    });

    const params = {
      model: 'BankConnection',
      action: 'findUnique',
      args: { where: { id: 1 } },
    };

    const result = await middleware(params, next);

    expect(result).toEqual({
      id: 1,
      plaidAccessToken: 'secret-token',
    });
  });

  it('should handle array results', async () => {
    const middleware = createEncryptionMiddleware();
    const next = jest.fn().mockResolvedValue([
      {
        id: 1,
        plaidAccessToken: JSON.stringify({ encrypted: 'secret-token-1' }),
      },
      {
        id: 2,
        plaidAccessToken: JSON.stringify({ encrypted: 'secret-token-2' }),
      },
    ]);

    const params = {
      model: 'BankConnection',
      action: 'findMany',
      args: {},
    };

    const result = await middleware(params, next);

    expect(result).toEqual([
      {
        id: 1,
        plaidAccessToken: 'secret-token-1',
      },
      {
        id: 2,
        plaidAccessToken: 'secret-token-2',
      },
    ]);
  });

  it('should skip encryption for non-configured models', async () => {
    const middleware = createEncryptionMiddleware();
    const data = { id: 1, name: 'Test' };
    const next = jest.fn().mockResolvedValue(data);

    const params = {
      model: 'User',
      action: 'create',
      args: { data },
    };

    const result = await middleware(params, next);

    expect(next).toHaveBeenCalledWith(params);
    expect(result).toEqual(data);
    expect(Encryption.encrypt).not.toHaveBeenCalled();
    expect(Encryption.decrypt).not.toHaveBeenCalled();
  });

  it('should handle decryption errors gracefully', async () => {
    const middleware = createEncryptionMiddleware();
    const next = jest.fn().mockResolvedValue({
      id: 1,
      plaidAccessToken: 'invalid-json',
    });

    const params = {
      model: 'BankConnection',
      action: 'findUnique',
      args: { where: { id: 1 } },
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await middleware(params, next);

    expect(result).toEqual({
      id: 1,
      plaidAccessToken: 'invalid-json',
    });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should require ENCRYPTION_KEY environment variable', () => {
    delete process.env.ENCRYPTION_KEY;
    
    expect(() => {
      // Re-import the module to trigger the environment check
      jest.isolateModules(() => {
        require('../prisma-encryption');
      });
    }).toThrow('ENCRYPTION_KEY environment variable is required');
  });
}); 