import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm' as const;
  private key: Buffer;
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error('Encryption key is required');
    }
    // Derive a consistent 32-byte key using SHA-256
    this.key = crypto.createHash('sha256').update(secretKey).digest();
  }

  encrypt(text: string): string {
    if (text === null || text === undefined) return text as any;
    if (typeof text !== 'string') {
      throw new Error('Only string values can be encrypted');
    }
    if (text === '') return '';
    
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH
    });
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Return as iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    if (encryptedText === null || encryptedText === undefined) return encryptedText as any;
    if (typeof encryptedText !== 'string') {
      throw new Error('Encrypted text must be a string');
    }
    if (encryptedText === '') return '';
    
    try {
      const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
      
      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted text format');
      }
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      if (iv.length !== this.IV_LENGTH) {
        throw new Error('Invalid IV length');
      }
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH
      });
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Helper to check if a string is encrypted
  isEncrypted(value: string): boolean {
    if (typeof value !== 'string') return false;
    const parts = value.split(':');
    return parts.length === 3 && 
           parts[0].length === 32 && 
           parts[1].length === 32 && 
           parts[2].length > 0;
  }
}

// Singleton instance
export const encryptionService = new EncryptionService(
  process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production'
);

// Type for encrypted fields in Prisma models
export type EncryptedField<T> = T extends string ? string : never;

// Type utility to mark fields as encrypted in a model
export type WithEncryptedFields<Model, Fields extends keyof Model> = Omit<Model, Fields> & {
  [K in Fields]: EncryptedField<Model[K]>;
};
