import { encryptionService } from '../utils/encryption';

type PrismaModel = 'User' | 'Account' | 'Transaction' | 'PlaidItem';
type PrismaAction = 'findUnique' | 'findMany' | 'create' | 'update' | 'delete' | 'deleteMany' | 'upsert' | 'createMany' | 'updateMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count';

type PrismaMiddlewareParams = {
  model?: PrismaModel;
  action: PrismaAction;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
};

type PrismaNext = (params: PrismaMiddlewareParams) => Promise<any>;

type MiddlewareParams = {
  model?: string;
  action: PrismaAction;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
};

// Fields to be encrypted for each model
const ENCRYPTED_FIELDS: Record<PrismaModel, string[]> = {
  User: ['resetToken', 'verificationCode'],  // Note: password is hashed by auth system, not encrypted
  Account: [],  // Account name should be searchable, so not encrypted
  Transaction: ['description', 'category', 'notes'],
  PlaidItem: ['accessToken', 'error']
} as const;

/**
 * Middleware function for automatically encrypting/decrypting sensitive data
 * in Prisma operations
 */
export function encryptionMiddleware() {
  return async (params: MiddlewareParams, next: (params: MiddlewareParams) => Promise<any>): Promise<any> => {
    // Skip if model is not defined or doesn't have encrypted fields
    if (!params.model) {
      return next(params);
    }
    
    const modelName = params.model;
    const fieldsToEncrypt = ENCRYPTED_FIELDS[modelName as keyof typeof ENCRYPTED_FIELDS] || [];
    
    if (fieldsToEncrypt.length === 0) {
      return next(params);
    }
    
    // Encrypt data before it's written to the database
    if (['create', 'update', 'upsert', 'createMany', 'updateMany'].includes(params.action)) {
      if (params.args.data) {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => 
            encryptFields(item, fieldsToEncrypt)
          );
        } else {
          // Skip encryption if this is a password update (handled by auth system)
          if (params.model === 'User' && params.args.data.password) {
            const { password, ...rest } = params.args.data;
            params.args.data = encryptFields(rest, fieldsToEncrypt);
            params.args.data.password = password; // Keep the hashed password as is
          } else {
            params.args.data = encryptFields(params.args.data, fieldsToEncrypt);
          }
        }
      }
      
      // Handle nested create/update for relations
      if (params.args.include || params.args.select) {
        const processNested = (data: Record<string, any>): Record<string, any> => {
          if (!data || typeof data !== 'object') return data;
          
          const result: Record<string, any> = {};
          for (const [key, value] of Object.entries(data)) {
            if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
              result[key] = processNested(value as Record<string, any>);
            } else if (key === 'create' || key === 'update' || key === 'connectOrCreate') {
              result[key] = processNested(value as Record<string, any>);
            } else if (key === 'createMany' && value && typeof value === 'object' && 'data' in value) {
              const createManyValue = value as { data: any };
              result[key] = {
                ...createManyValue,
                data: Array.isArray(createManyValue.data) 
                  ? createManyValue.data.map((item: any) => encryptFields(item, fieldsToEncrypt))
                  : encryptFields(createManyValue.data, fieldsToEncrypt)
              };
            } else {
              result[key] = value;
            }
          }
          return result;
        };
        
        params.args = processNested(params.args as Record<string, any>);
      }
    }

    // Execute the Prisma operation
    let result = await next(params);

    // Decrypt data after it's read from the database
    if (['findUnique', 'findFirst', 'findMany', 'findFirstOrThrow', 'findUniqueOrThrow'].includes(params.action)) {
      if (result) {
        if (Array.isArray(result)) {
          result = result.map(item => decryptFields(item, fieldsToEncrypt));
        } else {
          result = decryptFields(result, fieldsToEncrypt);
        }
      }
    }
    
    // Handle decryption for aggregation results that might include encrypted fields
    if (['groupBy', 'aggregate'].includes(params.action) && result) {
      // These operations return complex structures, so we need to be careful
      // For now, we'll just log that these operations might need special handling
      console.warn(`Encryption middleware: ${params.action} operation on ${modelName} might contain encrypted fields`);
    }

    return result;
  };
}

/**
 * Helper function to encrypt fields in an object
 * @param obj - The object containing fields to encrypt
 * @param fields - Array of field names to encrypt
 * @returns The object with encrypted fields
 */
function encryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
  if (!obj) return obj;
  
  const result = { ...obj } as Record<string, any>;
  
  for (const field of fields) {
    const value = result[field];
    
    // Skip undefined, null, or already encrypted values
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && encryptionService.isEncrypted(value)) continue;
    
    // Handle different value types
    if (Array.isArray(value)) {
      // For arrays, encrypt each string item
      result[field] = value.map(item => {
        if (typeof item === 'string' && !encryptionService.isEncrypted(item)) {
          return encryptionService.encrypt(item);
        }
        return item;
      });
    } else if (typeof value === 'string') {
      // Encrypt string values
      result[field] = encryptionService.encrypt(value);
    } else if (typeof value === 'object' && value !== null) {
      // For nested objects, recursively encrypt fields
      // This handles JSON objects stored in string fields
      try {
        const stringified = JSON.stringify(value);
        result[field] = encryptionService.encrypt(stringified);
      } catch (error) {
        console.error(`Failed to encrypt nested object in field ${field}:`, error);
        // Keep original value if encryption fails
      }
    }
  }
  
  // We know the shape matches T because we only modified fields in a type-safe way
  return result as unknown as T;
}

/**
 * Helper function to decrypt fields in an object
 * @param obj - The object containing fields to decrypt
 * @param fields - Array of field names to decrypt
 * @returns The object with decrypted fields
 */
function decryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
  if (!obj) return obj;
  
  const result = { ...obj } as Record<string, any>;
  
  for (const field of fields) {
    const value = result[field];
    if (value === undefined || value === null) continue;
    
    // Handle different value types
    if (Array.isArray(value)) {
      // For arrays, decrypt each string item
      result[field] = value.map(item => 
        typeof item === 'string' ? tryDecrypt(item) : item
      );
    } else if (typeof value === 'string') {
      // Decrypt string values
      const decrypted = tryDecrypt(value);
      
      // Try to parse JSON for object values that were stringified before encryption
      if (decrypted !== value) {  // Only attempt parsing if decryption actually happened
        try {
          // Check if the decrypted value is a valid JSON string
          if (decrypted.startsWith('{') || decrypted.startsWith('[')) {
            result[field] = JSON.parse(decrypted);
          } else {
            result[field] = decrypted;
          }
        } catch (error) {
          // If parsing fails, just use the decrypted string
          result[field] = decrypted;
        }
      } else {
        result[field] = decrypted;
      }
    }
  }
  
  return result as unknown as T;
}

/**
 * Helper function to safely attempt decryption
 * @param value - The string value to decrypt
 * @returns The decrypted string or the original value if decryption fails
 */
function tryDecrypt(value: string): string {
  try {
    // Only attempt to decrypt if the value appears to be encrypted
    if (encryptionService.isEncrypted(value)) {
      return encryptionService.decrypt(value);
    }
    return value;
  } catch (error) {
    console.error('Decryption failed:', error);
    // If decryption fails, return the original value
    // This handles cases where the value wasn't encrypted to begin with
    return value;
  }
}
