import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import prismaMock from './singleton';

// Export the mocked Prisma client for use in tests
export const prisma = prismaMock as any;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // No need to disconnect from a mock database
  jest.restoreAllMocks();
});

export async function createTestUser() {
  const hashedPassword = await bcrypt.hash('testpassword', 10);
  
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      verified: true,
    },
  });
}

export async function cleanupTestData() {
  // Delete all test data in reverse order of foreign key dependencies
  await prisma.transaction.deleteMany({});
  await prisma.plaidItem.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test-',
        endsWith: '@example.com',
      },
    },
  });
}

export async function setupTestDatabase() {
  // Run any necessary migrations or setup
  await prisma.$executeRaw`TRUNCATE TABLE "Transaction" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "PlaidItem" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Account" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
}

export async function teardownTestDatabase() {
  await cleanupTestData();
  await prisma.$disconnect();
}

// Handle process events to ensure proper cleanup
process.on('beforeExit', async () => {
  await teardownTestDatabase();
});

process.on('SIGINT', async () => {
  await teardownTestDatabase();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await teardownTestDatabase();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await teardownTestDatabase();
  process.exit(1);
});

export default {
  createTestUser,
  cleanupTestData,
  setupTestDatabase,
  teardownTestDatabase,
  prisma,
};
