import prisma from '../../lib/prisma';
import { Encryption } from '../encryption';

describe('Database Tests', () => {
  beforeAll(async () => {
    // Set up test environment
    process.env.ENCRYPTION_KEY = 'test-encryption-key';
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.bankConnection.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('User Data Isolation', () => {
    it('should create and retrieve user data', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should maintain data isolation between users', async () => {
      // Create two users
      const user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          passwordHash: 'hashed_password',
          firstName: 'User',
          lastName: 'One',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          passwordHash: 'hashed_password',
          firstName: 'User',
          lastName: 'Two',
        },
      });

      // Create bank connections for each user
      await prisma.bankConnection.create({
        data: {
          userId: user1.id,
          plaidAccessToken: 'user1_token',
          institutionName: 'Bank One',
          status: 'ACTIVE',
        },
      });

      await prisma.bankConnection.create({
        data: {
          userId: user2.id,
          plaidAccessToken: 'user2_token',
          institutionName: 'Bank Two',
          status: 'ACTIVE',
        },
      });

      // Verify each user can only see their own connections
      const user1Connections = await prisma.bankConnection.findMany({
        where: { userId: user1.id },
      });

      const user2Connections = await prisma.bankConnection.findMany({
        where: { userId: user2.id },
      });

      expect(user1Connections).toHaveLength(1);
      expect(user2Connections).toHaveLength(1);
      expect(user1Connections[0].institutionName).toBe('Bank One');
      expect(user2Connections[0].institutionName).toBe('Bank Two');
    });
  });

  describe('Data Encryption', () => {
    it('should encrypt sensitive data when creating records', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const connection = await prisma.bankConnection.create({
        data: {
          userId: user.id,
          plaidAccessToken: 'secret_token',
          institutionName: 'Test Bank',
          status: 'ACTIVE',
        },
      });

      // The token should be encrypted in the database
      const rawConnection = await prisma.$queryRaw`
        SELECT "plaidAccessToken" FROM "BankConnection" WHERE id = ${connection.id}
      `;

      const encryptedToken = (rawConnection as any)[0].plaidAccessToken;
      expect(encryptedToken).not.toBe('secret_token');
      expect(() => JSON.parse(encryptedToken)).not.toThrow();
    });

    it('should decrypt sensitive data when retrieving records', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const originalToken = 'secret_token';
      await prisma.bankConnection.create({
        data: {
          userId: user.id,
          plaidAccessToken: originalToken,
          institutionName: 'Test Bank',
          status: 'ACTIVE',
        },
      });

      const connection = await prisma.bankConnection.findFirst({
        where: { userId: user.id },
      });

      expect(connection).toBeDefined();
      expect(connection!.plaidAccessToken).toBe(originalToken);
    });

    it('should handle updates to encrypted fields', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const connection = await prisma.bankConnection.create({
        data: {
          userId: user.id,
          plaidAccessToken: 'original_token',
          institutionName: 'Test Bank',
          status: 'ACTIVE',
        },
      });

      const updatedToken = 'updated_token';
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: { plaidAccessToken: updatedToken },
      });

      const updatedConnection = await prisma.bankConnection.findUnique({
        where: { id: connection.id },
      });

      expect(updatedConnection).toBeDefined();
      expect(updatedConnection!.plaidAccessToken).toBe(updatedToken);
    });
  });

  describe('Relationship Integrity', () => {
    it('should cascade delete bank connections when user is deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      await prisma.bankConnection.create({
        data: {
          userId: user.id,
          plaidAccessToken: 'test_token',
          institutionName: 'Test Bank',
          status: 'ACTIVE',
        },
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: user.id },
      });

      // Verify bank connection was also deleted
      const connections = await prisma.bankConnection.findMany({
        where: { userId: user.id },
      });

      expect(connections).toHaveLength(0);
    });
  });
}); 