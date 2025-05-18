import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Create a mock Prisma client
const prismaMock = mockDeep<PrismaClient>();

// Mock the Prisma client module
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
  prisma: prismaMock,
}));

// Reset all mocks before each test
beforeEach(() => {
  // Reset the mock
  mockReset(prismaMock);
  
  // Set up default mock implementations for transaction and disconnect
  (prismaMock as any).$transaction.mockImplementation((callback: any) => callback(prismaMock));
  (prismaMock as any).$disconnect.mockResolvedValue(undefined);
  
  // Set up default mock implementations for model methods
  const mockModelMethods = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  };
  
  // Apply mock methods to all models used in tests
  const models = ['user', 'plaidItem', 'transaction', 'account'];
  models.forEach((model) => {
    if (!(prismaMock as any)[model]) {
      (prismaMock as any)[model] = { ...mockModelMethods };
    } else {
      Object.assign((prismaMock as any)[model], mockModelMethods);
    }
  });
});

// Export the mock for use in tests
export { prismaMock };
export default prismaMock as unknown as DeepMockProxy<PrismaClient>;
