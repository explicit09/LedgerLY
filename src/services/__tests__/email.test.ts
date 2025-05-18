import { EmailService } from '../email';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockImplementation((mailOptions) => Promise.resolve({
      messageId: 'test-message-id',
    })),
  }),
}));

describe('EmailService', () => {
  const mockConfig = {
    from: 'test@example.com',
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: {
      user: 'testuser',
      pass: 'testpass',
    },
  };

  let emailService: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    emailService = new EmailService(mockConfig);
  });

  describe('sendVerificationEmail', () => {
    const testEmail = 'user@example.com';
    const testToken = 'test-verification-token';

    beforeEach(() => {
      process.env.APP_URL = 'https://ledgerly.app';
    });

    it('should successfully send verification email', async () => {
      const result = await emailService.sendVerificationEmail(testEmail, testToken);

      expect(result).toBe(true);
      expect(nodemailer.createTransport).toHaveBeenCalledWith(mockConfig);
      expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: mockConfig.from,
          to: testEmail,
          subject: expect.stringContaining('Verify'),
          text: expect.stringContaining(testToken),
          html: expect.stringContaining(testToken),
        })
      );
    });

    it('should handle email sending failure', async () => {
      // Mock email sending failure
      (nodemailer.createTransport() as jest.Mocked<any>).sendMail.mockRejectedValueOnce(
        new Error('Failed to send email')
      );

      const result = await emailService.sendVerificationEmail(testEmail, testToken);

      expect(result).toBe(false);
    });
  });

  describe('sendPasswordResetEmail', () => {
    const testEmail = 'user@example.com';
    const testToken = 'test-reset-token';

    beforeEach(() => {
      process.env.APP_URL = 'https://ledgerly.app';
    });

    it('should successfully send password reset email', async () => {
      const result = await emailService.sendPasswordResetEmail(testEmail, testToken);

      expect(result).toBe(true);
      expect(nodemailer.createTransport).toHaveBeenCalledWith(mockConfig);
      expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: mockConfig.from,
          to: testEmail,
          subject: expect.stringContaining('Reset'),
          text: expect.stringContaining(testToken),
          html: expect.stringContaining(testToken),
        })
      );
    });

    it('should handle email sending failure', async () => {
      // Mock email sending failure
      (nodemailer.createTransport() as jest.Mocked<any>).sendMail.mockRejectedValueOnce(
        new Error('Failed to send email')
      );

      const result = await emailService.sendPasswordResetEmail(testEmail, testToken);

      expect(result).toBe(false);
    });
  });
}); 