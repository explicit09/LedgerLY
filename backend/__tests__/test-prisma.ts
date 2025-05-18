import { PrismaClient as OriginalPrismaClient } from '@prisma/client';

// Create a new Prisma client instance for tests
const testPrisma = new OriginalPrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

// Ensure the database URL is set
if (!process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL) {
  throw new Error('DATABASE_URL or TEST_DATABASE_URL environment variable is not set');
}

// Export the Prisma client
export default testPrisma;

// Re-export PrismaClient type
export const PrismaClient = OriginalPrismaClient;

// Export all other Prisma types
export * from '@prisma/client';
