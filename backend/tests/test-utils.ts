import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean the database by truncating all tables except _prisma_migrations
 */
async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }: { tablename: string }) => tablename)
    .filter((name: string) => name !== '_prisma_migrations')
    .map((name: string) => `"public"."${name}"`)
    .join(', ');

  try {
    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  } catch (error) {
    console.error('Error cleaning test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Set up the test database by cleaning it
 */
async function setupTestDatabase() {
  await cleanDatabase();
  // Add any additional setup code here
}

// Export the functions
export { cleanDatabase, setupTestDatabase };

// Default export for Jest global setup
export default async function() {
  await setupTestDatabase();
};
