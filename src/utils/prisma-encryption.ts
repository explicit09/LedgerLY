import { PrismaClient } from '@prisma/client';
import { Encryption } from './encryption';

// Configuration for which fields should be encrypted
interface EncryptionConfig {
  [model: string]: {
    [field: string]: boolean;
  };
}

const ENCRYPTION_CONFIG: EncryptionConfig = {
  BankConnection: {
    plaidAccessToken: true,
  },
  // Add more sensitive fields here as needed
};

// Get the encryption key from environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

/**
 * Encrypts sensitive fields in the data object based on the encryption config
 */
function encryptFields(data: any, modelName: string): any {
  if (!data || !ENCRYPTION_CONFIG[modelName]) {
    return data;
  }

  const encryptedData = { ...data };
  const fieldsToEncrypt = ENCRYPTION_CONFIG[modelName];

  for (const [field, shouldEncrypt] of Object.entries(fieldsToEncrypt)) {
    if (shouldEncrypt && encryptedData[field] && ENCRYPTION_KEY) {
      const encrypted = Encryption.encrypt(encryptedData[field], ENCRYPTION_KEY);
      encryptedData[field] = JSON.stringify(encrypted);
    }
  }

  return encryptedData;
}

/**
 * Decrypts sensitive fields in the data object based on the encryption config
 */
function decryptFields(data: any, modelName: string): any {
  if (!data || !ENCRYPTION_CONFIG[modelName]) {
    return data;
  }

  const decryptedData = { ...data };
  const fieldsToEncrypt = ENCRYPTION_CONFIG[modelName];

  for (const [field, shouldEncrypt] of Object.entries(fieldsToEncrypt)) {
    if (shouldEncrypt && decryptedData[field] && ENCRYPTION_KEY) {
      try {
        const encryptedData = JSON.parse(decryptedData[field]);
        decryptedData[field] = Encryption.decrypt(encryptedData, ENCRYPTION_KEY);
      } catch (error) {
        console.error(`Failed to decrypt field ${field} in ${modelName}:`, error);
        // Keep the encrypted value if decryption fails
      }
    }
  }

  return decryptedData;
}

/**
 * Creates a Prisma middleware that handles encryption/decryption of sensitive fields
 */
export function createEncryptionMiddleware() {
  return async (
    params: any,
    next: (params: any) => Promise<any>
  ) => {
    // Only process if we have encryption config for this model
    if (!params.model || !ENCRYPTION_CONFIG[params.model]) {
      return next(params);
    }

    // Handle encryption for create/update operations
    if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
      if (params.args.data) {
        params.args.data = encryptFields(params.args.data, params.model);
      }
    }

    // Execute the database operation
    const result = await next(params);

    // Handle decryption of results
    if (result) {
      if (Array.isArray(result)) {
        return result.map(item => decryptFields(item, params.model));
      } else {
        return decryptFields(result, params.model);
      }
    }

    return result;
  };
}

/**
 * Creates a new PrismaClient instance with encryption middleware
 */
export function createPrismaClient(): PrismaClient {
  const prisma = new PrismaClient();
  prisma.$use(createEncryptionMiddleware());
  return prisma;
} 