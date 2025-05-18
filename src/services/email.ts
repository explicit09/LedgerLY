import nodemailer from 'nodemailer';
import { generateSecureToken } from '../utils/password';

interface EmailConfig {
  from: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
    this.fromAddress = config.from;
  }

  /**
   * Sends a verification email to a user
   * @param to User's email address
   * @param token Verification token
   * @returns Promise resolving to true if email was sent successfully
   */
  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: 'Verify your LedgerLY account',
        text: `Welcome to LedgerLY!\n\nPlease verify your email address by clicking the following link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.`,
        html: `
          <h2>Welcome to LedgerLY!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
        `,
      });

      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  /**
   * Sends a password reset email
   * @param to User's email address
   * @param token Reset token
   * @returns Promise resolving to true if email was sent successfully
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: 'Reset your LedgerLY password',
        text: `You requested to reset your LedgerLY password.\n\nClick the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.`,
        html: `
          <h2>Reset Your Password</h2>
          <p>You requested to reset your LedgerLY password.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
        `,
      });

      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }
} 