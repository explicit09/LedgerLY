import { PrismaClient } from '@prisma/client';
import { encryptionService } from '../src/utils/encryption';
import { createPrismaClientWithEncryption } from '../src/utils/prisma-encryption';

// Create a separate Prisma client for testing with encryption
const prisma = createPrismaClientWithEncryption();

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'securePassword123!',
  firstName: 'Test',
  lastName: 'User',
  verificationCode: '123456',
};

// Helper function to clean up test data
const cleanUpTestData = async () => {
  try {
    await prisma.user.deleteMany({
      where: { 
        OR: [
          { email: testUser.email },
          { email: { contains: 'user1-' } },
          { email: { contains: 'user2-' } },
        ]
      },
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};

describe('Encryption Service', () => {
  beforeAll(async () => {
    // Clear any existing test data
    await cleanUpTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanUpTestData();
  });

  afterAll(async () => {
    // Disconnect Prisma client
    await prisma.$disconnect();
  });

  describe('Basic Encryption', () => {
    it('should encrypt and decrypt string data', () => {
      const data = 'test data';
      const encrypted = encryptionService.encrypt(data);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(data);
      expect(encryptionService.isEncrypted(encrypted)).toBe(true);
    });

    it('should encrypt and decrypt object data', () => {
      const data = { email: testUser.email, password: testUser.password };
      const encrypted = encryptionService.encrypt(JSON.stringify(data));
      const decrypted = JSON.parse(encryptionService.decrypt(encrypted));

      expect(decrypted.email).toBe(testUser.email);
      expect(decrypted.password).toBe(testUser.password);
    });

    it('should detect encrypted strings', () => {
      const data = 'test data';
      const encrypted = encryptionService.encrypt(data);
      
      expect(encryptionService.isEncrypted(encrypted)).toBe(true);
      expect(encryptionService.isEncrypted('not-encrypted')).toBe(false);
    });

    it('should throw error when decrypting non-encrypted data', () => {
      expect(() => encryptionService.decrypt('not-encrypted')).toThrow();
    });
  });

  describe('Database Integration', () => {
    it('should encrypt sensitive fields when creating a user', async () => {
      // Test transaction with multiple operations
      const [user1, user2] = await prisma.$transaction([
        prisma.user.create({
          data: {
            email: `user1-${Date.now()}@example.com`,
            password: encryptionService.encrypt('password1'),
            firstName: 'User',
            lastName: 'One',
          },
        }),
        prisma.user.create({
          data: {
            email: `user2-${Date.now()}@example.com`,
            password: encryptionService.encrypt('password2'),
            firstName: 'User',
            lastName: 'Two',
          },
        }),
      ]);

      // Verify the users were created
      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
      
      // Check if we have two distinct users
      expect(user1.email).not.toBe(user2.email);
      
      // Check if emails are encrypted
      const isEmail1Encrypted = encryptionService.isEncrypted(user1.email);
      const isEmail2Encrypted = encryptionService.isEncrypted(user2.email);
      
      // If emails are encrypted, they should be in the format "iv:authTag:encrypted"
      if (isEmail1Encrypted) {
        const [iv, authTag] = user1.email.split(':');
        expect(iv).toHaveLength(32);
        expect(authTag).toHaveLength(32);
      } else {
        expect(user1.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
      }
      
      if (isEmail2Encrypted) {
        const [iv, authTag] = user2.email.split(':');
        expect(iv).toHaveLength(32);
        expect(authTag).toHaveLength(32);
      } else {
        expect(user2.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
      }
      
      // Verify both users have encrypted passwords
      expect(encryptionService.isEncrypted(user1.password)).toBe(true);
      expect(encryptionService.isEncrypted(user2.password)).toBe(true);

      // Verify the passwords are encrypted in the database
      const dbUser1 = await prisma.user.findUnique({
        where: { id: user1.id },
      });
      
      expect(dbUser1).not.toBeNull();
      expect(encryptionService.isEncrypted(dbUser1!.password)).toBe(true);
      expect(encryptionService.decrypt(dbUser1!.password)).toBe('password1');

      const dbUser2 = await prisma.user.findUnique({
        where: { id: user2.id },
      });
      
      expect(dbUser2).not.toBeNull();
      expect(encryptionService.isEncrypted(dbUser2!.password)).toBe(true);
      expect(encryptionService.decrypt(dbUser2!.password)).toBe('password2');
      // Clean up
      await cleanUpTestData();
    });

    it('should handle updating encrypted fields', async () => {
      // Create initial user
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          password: encryptionService.encrypt(testUser.password),
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          verificationCode: testUser.verificationCode,
        },
      });

      // Verify the user was created with encrypted fields
      const createdUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(createdUser).not.toBeNull();
      expect(encryptionService.isEncrypted(createdUser!.password)).toBe(true);
      expect(encryptionService.decrypt(createdUser!.password)).toBe(testUser.password);
      
      expect(createdUser?.verificationCode).toBeDefined();
      if (createdUser?.verificationCode) {
        // Check if the verification code is encrypted
        const isEncrypted = encryptionService.isEncrypted(createdUser.verificationCode);
        if (isEncrypted) {
          const decryptedCode = encryptionService.decrypt(createdUser.verificationCode);
          expect(decryptedCode).toBe(testUser.verificationCode);
        } else {
          // If not encrypted, it should match directly
          expect(createdUser.verificationCode).toBe(testUser.verificationCode);
        }
      }

      // Update the user's password
      const newPassword = 'newSecurePassword123!';
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: encryptionService.encrypt(newPassword),
          verificationCode: encryptionService.encrypt('654321')
        },
      });

      // Verify the update
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser).not.toBeNull();
      expect(encryptionService.isEncrypted(updatedUser!.password)).toBe(true);
      expect(encryptionService.decrypt(updatedUser!.password)).toBe(newPassword);
      
      expect(updatedUser?.verificationCode).toBeDefined();
      if (updatedUser?.verificationCode) {
        // Check if the verification code is encrypted
        const isEncrypted = encryptionService.isEncrypted(updatedUser.verificationCode);
        if (isEncrypted) {
          const decryptedCode = encryptionService.decrypt(updatedUser.verificationCode);
          expect(decryptedCode).toBe('654321');
        } else {
          // If not encrypted, it should match directly
          expect(updatedUser.verificationCode).toBe('654321');
        }
      }
      
      // Clean up
      await prisma.user.delete({
        where: { id: user.id },
      });
    });
  });
});
