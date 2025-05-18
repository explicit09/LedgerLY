// Mock the logger
type MockLogger = {
  info: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
  warn: jest.Mock;
};

export const mockLogger: MockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};

// Mock the encryption service
type MockEncryption = {
  decrypt: jest.Mock;
  encrypt: jest.Mock;
};

export const mockEncryption: MockEncryption = {
  decrypt: jest.fn().mockImplementation((token: string) => `decrypted_${token}`),
  encrypt: jest.fn().mockImplementation((token: string) => `encrypted_${token}`),
};

// Mock Prisma client
type MockPrismaClient = {
  plaidItem: {
    findFirst: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
  };
  $transaction: jest.Mock;
  $executeRaw: jest.Mock;
  $queryRaw: jest.Mock;
};

export const mockPrisma: MockPrismaClient = {
  plaidItem: {
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation((callback) => 
    callback({
      ...mockPrisma,
      $executeRaw: jest.fn().mockResolvedValue(0),
      $queryRaw: jest.fn().mockResolvedValue([]),
    })
  ),
  $executeRaw: jest.fn().mockResolvedValue(0),
  $queryRaw: jest.fn().mockResolvedValue([]),
};

// Mock the response utilities
export const mockSendSuccessResponse = jest.fn().mockImplementation((res, data) => {
  res.status(200).json({ success: true, ...data });
});

export const mockSendErrorResponse = jest.fn().mockImplementation((res, error) => {
  res.status(error.statusCode || 500).json({ 
    success: false, 
    error: { message: error.message } 
  });
});

// Set up the mocks before importing the controller
jest.mock('../../src/utils/logger', () => ({
  logger: mockLogger,
}));

jest.mock('../../src/utils/encryption', () => ({
  decrypt: mockEncryption.decrypt,
  encrypt: mockEncryption.encrypt,
  encryptionService: mockEncryption,
}));

jest.mock('../../src/utils/apiResponse', () => ({
  sendSuccessResponse: (...args: any[]) => mockSendSuccessResponse(...args),
  sendErrorResponse: (...args: any[]) => mockSendErrorResponse(...args),
}));

// Mock the prisma instance from lib/prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: mockPrisma,
  Prisma: {
    sql: jest.fn().mockImplementation((strings, ...values) => ({
      strings,
      values,
    })),
  },
}));

// Reset all mocks before each test
export const resetMocks = () => {
  jest.clearAllMocks();
  
  // Reset mock implementations
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
  mockLogger.debug.mockClear();
  mockLogger.warn.mockClear();
  
  mockEncryption.decrypt.mockClear();
  mockEncryption.encrypt.mockClear();
  
  mockPrisma.plaidItem.findFirst.mockClear();
  mockPrisma.plaidItem.update.mockClear();
  mockPrisma.plaidItem.findMany.mockClear();
  mockPrisma.$executeRaw.mockClear();
  mockPrisma.$queryRaw.mockClear();
  mockPrisma.$transaction.mockClear();
  
  mockSendSuccessResponse.mockClear();
  mockSendErrorResponse.mockClear();
};
