import { PrismaClient as BasePrismaClient, Prisma as PrismaNamespace } from '@prisma/client';
import { encryptionMiddleware } from '../middleware/encryption.middleware';

// Re-export Prisma types
export { Prisma } from '@prisma/client';

// Extend the PrismaClient type to include our models
type PrismaClient = BasePrismaClient & {
  $use: (middleware: any) => void;
  plaidItem: {
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
    // Add other methods as needed
  };
};

// Create a singleton Prisma client instance with connection retry logic
let prisma: PrismaClient;

try {
  prisma = new BasePrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  }) as unknown as PrismaClient;

  // Add encryption middleware to the Prisma client
  prisma.$use(encryptionMiddleware());

  // Test the database connection
  prisma.$connect().catch((error: unknown) => {
    console.error('Failed to connect to the database:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
} catch (error: unknown) {
  console.error('Failed to initialize Prisma client:', error instanceof Error ? error.message : error);
  process.exit(1);
}

// In development, set up a global instance to avoid too many clients during hot-reloading
if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

export { prisma };

// Re-export all Prisma types
export * from '@prisma/client';

// Export Prisma namespace for middleware
export type { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Define missing types that are needed by middleware
type PrismaAction = 'findUnique' | 'findMany' | 'create' | 'update' | 'delete' | 'deleteMany' | 'upsert' | 'createMany' | 'updateMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count';

interface MiddlewareParams {
  model?: string;
  action: PrismaAction;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
}

export type { PrismaAction, MiddlewareParams };
