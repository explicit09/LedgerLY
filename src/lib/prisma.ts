import { createPrismaClient } from '../utils/prisma-encryption';

// Create a singleton instance of PrismaClient with encryption middleware
const prisma = createPrismaClient();

// Handle cleanup on application shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma; 