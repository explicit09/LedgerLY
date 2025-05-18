import { Encryption } from '../encryption';

describe('Encryption Utility', () => {
  const testData = 'sensitive data to encrypt';
  const testPassword = 'test-password-123';

  describe('encrypt and decrypt', () => {
    it('should successfully encrypt and decrypt data', () => {
      const encrypted = Encryption.encrypt(testData, testPassword);
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('salt');

      const decrypted = Encryption.decrypt(encrypted, testPassword);
      expect(decrypted).toBe(testData);
    });

    it('should fail decryption with wrong password', () => {
      const encrypted = Encryption.encrypt(testData, testPassword);
      expect(() => {
        Encryption.decrypt(encrypted, 'wrong-password');
      }).toThrow();
    });

    it('should generate different ciphertexts for same plaintext', () => {
      const encrypted1 = Encryption.encrypt(testData, testPassword);
      const encrypted2 = Encryption.encrypt(testData, testPassword);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });
  });

  describe('generateKey', () => {
    it('should generate a random key of correct length', () => {
      const key = Encryption.generateKey();
      expect(typeof key).toBe('string');
      expect(key.length).toBe(64); // 32 bytes in hex = 64 characters
    });

    it('should generate unique keys', () => {
      const key1 = Encryption.generateKey();
      const key2 = Encryption.generateKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('hash and verify', () => {
    it('should generate consistent hashes with same salt', () => {
      const { hash: hash1, salt } = Encryption.hash(testData);
      const { hash: hash2 } = Encryption.hash(testData, salt);
      expect(hash1).toBe(hash2);
    });

    it('should verify correct data', () => {
      const { hash, salt } = Encryption.hash(testData);
      expect(Encryption.verifyHash(testData, hash, salt)).toBe(true);
    });

    it('should reject incorrect data', () => {
      const { hash, salt } = Encryption.hash(testData);
      expect(Encryption.verifyHash('wrong data', hash, salt)).toBe(false);
    });

    it('should generate different hashes for same data with different salts', () => {
      const { hash: hash1 } = Encryption.hash(testData);
      const { hash: hash2 } = Encryption.hash(testData);
      expect(hash1).not.toBe(hash2);
    });
  });
}); 