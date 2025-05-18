import { PrismaClient } from '@prisma/client';

// Only create a new PrismaClient if we're not in a test environment
// This prevents multiple instances of Prisma Client in development
const globalWithPrisma = global as typeof globalThis & {
  prisma: PrismaClient;
};

const prisma = globalWithPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.prisma = prisma;
}

export default prisma;
