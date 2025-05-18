import { PrismaClient } from '@prisma/client';
import type { User } from '@prisma/client';
import { validatePassword, hashPassword, generateSecureToken } from '../utils/password';
import { EmailService } from './email';
import prisma from '../lib/prisma';

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: User;
  errors?: string[];
}

export class AuthService {
  private prisma: PrismaClient;
  private emailService: EmailService;

  constructor(
    prismaClient: PrismaClient = prisma,
    emailService?: EmailService
  ) {
    this.prisma = prismaClient;
    if (emailService) {
      this.emailService = emailService;
    } else {
      // Create default email service if not provided
      this.emailService = new EmailService({
        from: process.env.EMAIL_FROM || 'noreply@ledgerly.app',
        host: process.env.EMAIL_HOST || '',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || '',
        },
      });
    }
  }

  /**
   * Validates email format
   * @param email Email to validate
   * @returns true if email is valid
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Registers a new user and sends verification email
   * @param data User registration data
   * @returns Registration result with user data or errors
   */
  async registerUser(data: RegistrationData): Promise<RegistrationResult> {
    const errors: string[] = [];

    // Validate email
    if (!this.validateEmail(data.email)) {
      errors.push('Invalid email format');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      errors.push('Email already registered');
    }

    // Validate password
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Return errors if validation failed
    if (errors.length > 0) {
      return { success: false, errors };
    }

    try {
      // Generate verification token
      const verificationToken = generateSecureToken();

      // Hash password and create user
      const hashedPassword = await hashPassword(data.password);
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          verificationToken,
          isVerified: false,
        },
      });

      // Send verification email
      const emailSent = await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken
      );

      if (!emailSent) {
        // Log the error but don't fail registration
        console.error('Failed to send verification email to:', user.email);
      }

      return { success: true, user };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        errors: ['An error occurred during registration. Please try again.'],
      };
    }
  }

  /**
   * Verifies a user's email address using the verification token
   * @param token The verification token
   * @returns true if verification was successful
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { verificationToken: token },
      });

      if (!user) {
        return false;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
        },
      });

      return true;
    } catch (error) {
      console.error('Error verifying email:', error);
      return false;
    }
  }

  /**
   * Resends the verification email to a user
   * @param email The user's email address
   * @returns true if the email was sent successfully
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user || user.isVerified) {
        return false;
      }

      // Generate new verification token
      const verificationToken = generateSecureToken();

      await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationToken },
      });

      return await this.emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Error resending verification email:', error);
      return false;
    }
  }
} 