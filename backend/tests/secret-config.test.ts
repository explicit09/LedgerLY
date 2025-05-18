import { getSecretId, getSecretIdForEnv, getSecretPrefix, isSecretAccessAllowed } from '../src/services/secrets/secret-config';

describe('Secret Configuration', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('getSecretId', () => {
    it('should prefix secret name with environment', () => {
      process.env.NODE_ENV = 'test';
      expect(getSecretId('database/credentials')).toBe('test/database/credentials');
    });

    it('should not add duplicate environment prefix', () => {
      process.env.NODE_ENV = 'test';
      expect(getSecretId('test/database/credentials')).toBe('test/database/credentials');
    });

    it('should handle empty environment by using default', () => {
      delete process.env.NODE_ENV;
      expect(getSecretId('database/credentials')).toBe('development/database/credentials');
    });
  });

  describe('getSecretIdForEnv', () => {
    it('should use specified environment prefix', () => {
      expect(getSecretIdForEnv('database/credentials', 'production')).toBe('production/database/credentials');
    });

    it('should replace existing environment prefix', () => {
      expect(getSecretIdForEnv('test/database/credentials', 'production')).toBe('production/database/credentials');
    });
  });

  describe('getSecretPrefix', () => {
    it('should return environment prefix with trailing slash', () => {
      process.env.NODE_ENV = 'staging';
      expect(getSecretPrefix()).toBe('staging/');
    });

    it('should use default environment when not set', () => {
      delete process.env.NODE_ENV;
      expect(getSecretPrefix()).toBe('development/');
    });
  });

  describe('isSecretAccessAllowed', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      process.env.AWS_SECRETS_PREFIX = '/ledgerly/';
    });

    it('should allow access to current environment secrets', () => {
      expect(isSecretAccessAllowed('test/database/credentials')).toBe(true);
    });

    it('should allow access to shared secrets (no env prefix)', () => {
      expect(isSecretAccessAllowed('shared/secret')).toBe(true);
    });

    it('should allow access to secrets under AWS_SECRETS_PREFIX', () => {
      expect(isSecretAccessAllowed('/ledgerly/shared/secret')).toBe(true);
    });

    it('should deny access to other environments\' secrets', () => {
      expect(isSecretAccessAllowed('production/database/credentials')).toBe(false);
    });

    it('should handle undefined or null input', () => {
      expect(isSecretAccessAllowed(undefined as any)).toBe(false);
      expect(isSecretAccessAllowed(null as any)).toBe(false);
      expect(isSecretAccessAllowed('')).toBe(false);
    });
  });
});
