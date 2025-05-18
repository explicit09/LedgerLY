import { v4 as uuidv4 } from 'uuid';
// Mock the encryption service
const encryptionService = {
  encrypt: (data: string) => `encrypted_${data}`,
  decrypt: (data: string) => data.replace('encrypted_', ''),
};
import prisma from '../../__tests__/singleton';

/**
 * Create a test user with a Plaid item
 */
export async function createTestUserWithPlaidItem(overrides = {}) {
  const userId = uuidv4();
  const itemId = `item-${uuidv4()}`;
  const accessToken = `access-${uuidv4()}`;
  const encryptedAccessToken = encryptionService.encrypt(accessToken);

  const user = {
    id: userId,
    email: `test-${uuidv4()}@example.com`,
    name: 'Test User',
    plaidItems: [{
      id: `plaid-item-${uuidv4()}`,
      itemId,
      accessToken: encryptedAccessToken,
      institutionId: 'ins_123',
      institutionName: 'Test Bank',
      status: 'ACTIVE',
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }]
  };
  
  // Mock the Prisma client to return the test user
  (prisma as any).user.create.mockResolvedValue(user);

  return {
    user,
    plaidItem: user.plaidItems[0],
    accessToken,
  };
}

/**
 * Generate a test webhook payload
 */
export function generateWebhookPayload(
  webhookType: string,
  webhookCode: string,
  itemId: string,
  overrides: Record<string, any> = {}
) {
  const basePayload = {
    webhook_type: webhookType,
    webhook_code: webhookCode,
    item_id: itemId,
    error: null,
    new_transactions: 0,
    removed_transactions: [],
    ...overrides,
  };

  return basePayload;
}

/**
 * Generate a mock Plaid error response
 */
export function generatePlaidError(
  errorType: string,
  errorCode: string,
  errorMessage: string,
  requestId = `req-${uuidv4()}`
) {
  return {
    response: {
      data: {
        error_type: errorType,
        error_code: errorCode,
        error_message: errorMessage,
        display_message: errorMessage,
        request_id: requestId,
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {},
    },
  };
}
