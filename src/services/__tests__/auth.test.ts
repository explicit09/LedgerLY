import { PrismaClient } from '@prisma/client';
import { AuthService, RegistrationData } from '../auth';
import { EmailService } from '../email';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock PrismaClient and EmailService
const mockPrisma = mockDeep<PrismaClient>();
const mockEmailService = mockDeep<EmailService>();

// Create a new instance of AuthService with the mock services
const authService = new AuthService(mockPrisma, mockEmailService);

describe('AuthService', () => {
  beforeEach(() => {
    mockReset(mockPrisma);
    mockReset(mockEmailService);
  });

  describe('registerUser', () => {
    const validRegistrationData: RegistrationData = {
      email: 'test@example.com',
      password: 'StrongP@ss123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should successfully register a new user and send verification email', async () => {
      // Mock user not existing
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock user creation
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: validRegistrationData.email,
        passwordHash: 'hashed_password',
        firstName: validRegistrationData.firstName,
        lastName: validRegistrationData.lastName,
        verificationToken: 'test-token',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock email sending
      mockEmailService.sendVerificationEmail.mockResolvedValue(true);

      const result = await authService.registerUser(validRegistrationData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(validRegistrationData.email);
      expect(result.user?.verificationToken).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        validRegistrationData.email,
        expect.any(String)
      );
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email',
      };

      const result = await authService.registerUser(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid email format');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject registration with existing email', async () => {
      // Mock user already existing
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: validRegistrationData.email,
        passwordHash: 'existing_hash',
        firstName: 'Existing',
        lastName: 'User',
        verificationToken: null,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.registerUser(validRegistrationData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Email already registered');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: 'weak',
      };

      const result = await authService.registerUser(weakPasswordData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

      const result = await authService.registerUser(validRegistrationData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('An error occurred during registration. Please try again.');
    });

    it('should complete registration even if email sending fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: validRegistrationData.email,
        passwordHash: 'hashed_password',
        firstName: validRegistrationData.firstName,
        lastName: validRegistrationData.lastName,
        verificationToken: 'test-token',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEmailService.sendVerificationEmail.mockResolvedValue(false);

      const result = await authService.registerUser(validRegistrationData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify a valid token', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        verificationToken: 'valid-token',
        isVerified: false,
      };

      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({
        ...user,
        isVerified: true,
        verificationToken: null,
      });

      const result = await authService.verifyEmail('valid-token');

      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
        },
      });
    });

    it('should return false for invalid token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await authService.verifyEmail('invalid-token');

      expect(result).toBe(false);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('resendVerificationEmail', () => {
    it('should successfully resend verification email', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        isVerified: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({
        ...user,
        verificationToken: 'new-token',
      });
      mockEmailService.sendVerificationEmail.mockResolvedValue(true);

      const result = await authService.resendVerificationEmail('test@example.com');

      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should return false for verified user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        isVerified: true,
      });

      const result = await authService.resendVerificationEmail('test@example.com');

      expect(result).toBe(false);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return false for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.resendVerificationEmail('nonexistent@example.com');

      expect(result).toBe(false);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
}); 