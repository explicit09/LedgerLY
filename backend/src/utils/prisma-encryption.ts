import { PrismaClient } from '@prisma/client';
import { encryptionService } from './encryption';

type PrismaAction = 'findUnique' | 'findMany' | 'create' | 'update' | 'delete' | 'deleteMany' | 'upsert' | 'createMany' | 'updateMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count';

interface MiddlewareParams {
  model?: string;
  action: PrismaAction;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
}

/**
 * Configuration for which fields should be encrypted in each model
 * Add sensitive fields that need encryption here
 */
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  PlaidItem: ['accessToken', 'itemId'],
  User: ['resetToken'],
  Transaction: ['description'],
  // Add more models and their sensitive fields as needed
};

/**
 * Creates a Prisma middleware that automatically encrypts/decrypts sensitive fields
 * based on the ENCRYPTED_FIELDS configuration
 */
export function createEncryptionMiddleware() {
  return async (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => Promise<any>
  ) => {
    // Skip if no encryption is needed for this model
    if (!params.model || !ENCRYPTED_FIELDS[params.model]) {
      return next(params);
    }

    const fieldsToEncrypt = ENCRYPTED_FIELDS[params.model];

    // Handle encryption for write operations
    if (['create', 'update', 'upsert'].includes(params.action)) {
      if (params.args.data) {
        params.args.data = encryptFields(params.args.data, fieldsToEncrypt);
      }

      // Handle updateMany
      if (params.action === 'updateMany' && params.args.data) {
        params.args.data = encryptFields(params.args.data, fieldsToEncrypt);
      }

      // Handle upsert
      if (params.action === 'upsert') {
        if (params.args.create) {
          params.args.create = encryptFields(params.args.create, fieldsToEncrypt);
        }
        if (params.args.update) {
          params.args.update = encryptFields(params.args.update, fieldsToEncrypt);
        }
      }
    }

    const result = await next(params);

    // Handle decryption for read operations
    if (result) {
      return decryptResult(result, params.model, fieldsToEncrypt);
    }

    return result;
  };
}

/**
 * Encrypts fields in an object based on the fieldsToEncrypt array
 */
function encryptFields(data: any, fieldsToEncrypt: string[]): any {
  if (!data || typeof data !== 'object') return data;

  const result = { ...data };

  for (const field of fieldsToEncrypt) {
    if (result[field] !== undefined && result[field] !== null) {
      // Only encrypt string values
      if (typeof result[field] === 'string') {
        result[field] = encryptionService.encrypt(result[field]);
      }
    }
  }

  return result;
}

/**
 * Decrypts fields in the result object or array
 */
function decryptResult(result: any, model: string, fieldsToEncrypt: string[]): any {
  // Handle array results (findMany, etc.)
  if (Array.isArray(result)) {
    return result.map(item => decryptObject(item, fieldsToEncrypt));
  }

  // Handle single object results
  return decryptObject(result, fieldsToEncrypt);
}

/**
 * Decrypts fields in a single object
 */
function decryptObject(obj: any, fieldsToEncrypt: string[]): any {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };

  for (const field of fieldsToEncrypt) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        // Check if the field is actually encrypted before trying to decrypt
        if (encryptionService.isEncrypted(result[field])) {
          result[field] = encryptionService.decrypt(result[field]);
        }
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep the encrypted value if decryption fails
      }
    }
  }

  return result;
}

// Create a singleton Prisma client with encryption middleware
let prismaWithEncryption: PrismaClient;

export function createPrismaClientWithEncryption(): PrismaClient {
  if (!prismaWithEncryption) {
    prismaWithEncryption = new PrismaClient();
    prismaWithEncryption.$use(createEncryptionMiddleware() as any);
  }
  return prismaWithEncryption;
}

const encryptionMiddleware = createEncryptionMiddleware();
export { encryptionMiddleware };
export default encryptionMiddleware;
