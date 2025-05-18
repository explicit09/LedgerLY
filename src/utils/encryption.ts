import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;

interface EncryptedData {
  encrypted: string;  // Encrypted data in hex
  iv: string;        // Initialization vector in hex
  authTag: string;   // Authentication tag in hex
  salt: string;      // Salt used for key derivation in hex
}

export class Encryption {
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
  }

  /**
   * Encrypts sensitive data using AES-256-GCM
   * @param text - The text to encrypt
   * @param password - The encryption password
   * @returns EncryptedData object containing encrypted data and metadata
   */
  static encrypt(text: string, password: string): EncryptedData {
    // Generate a random salt for key derivation
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive encryption key from password and salt
    const key = this.deriveKey(password, salt);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: salt.toString('hex')
    };
  }

  /**
   * Decrypts encrypted data
   * @param encryptedData - The EncryptedData object containing encrypted text and metadata
   * @param password - The encryption password
   * @returns Decrypted text
   */
  static decrypt(encryptedData: EncryptedData, password: string): string {
    try {
      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      const salt = Buffer.from(encryptedData.salt, 'hex');
      
      // Derive the same key using password and salt
      const key = this.deriveKey(password, salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the text
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed. The data may be corrupted or the password is incorrect.');
    }
  }

  /**
   * Generates a secure random encryption key
   * @returns A secure random key in hex format
   */
  static generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  /**
   * Hashes sensitive data (like passwords) using SHA-512
   * @param data - The data to hash
   * @param salt - Optional salt for the hash
   * @returns Hashed data in hex format
   */
  static hash(data: string, salt?: string): { hash: string; salt: string } {
    const useSalt = salt || crypto.randomBytes(SALT_LENGTH).toString('hex');
    const hash = crypto.createHmac('sha512', useSalt)
      .update(data)
      .digest('hex');
    
    return { hash, salt: useSalt };
  }

  /**
   * Verifies if the data matches its hash
   * @param data - The data to verify
   * @param hash - The hash to verify against
   * @param salt - The salt used in hashing
   * @returns boolean indicating if the data matches the hash
   */
  static verifyHash(data: string, hash: string, salt: string): boolean {
    const { hash: newHash } = this.hash(data, salt);
    return newHash === hash;
  }
} 