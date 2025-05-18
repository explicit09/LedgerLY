// Type definitions for test utilities
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

declare const mockLogger: {
  info: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
  warn: jest.Mock;
};

declare const mockEncryption: {
  decrypt: jest.Mock;
  encrypt: jest.Mock;
};

declare const mockPrisma: {
  plaidItem: {
    findFirst: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
  };
  $transaction: jest.Mock;
  $executeRaw: jest.Mock;
  $queryRaw: jest.Mock;
};

declare const mockSendSuccessResponse: jest.Mock;
declare const mockSendErrorResponse: jest.Mock;

declare function resetMocks(): void;

export {
  mockLogger,
  mockEncryption,
  mockPrisma,
  mockSendSuccessResponse,
  mockSendErrorResponse,
  resetMocks
};
