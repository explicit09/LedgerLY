import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import {
  BadRequestError,
  UnauthorizedError,
  sendErrorResponse,
  sendSuccessResponse,
} from '../utils/errors';

// Types
interface PlaidError {
  error_type: string;
  error_code: string;
  error_message: string;
  display_message?: string;
  status_code: number;
}

type WebhookPayload = {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  error?: PlaidError;
  new_transactions?: number;
  removed_transactions?: string[];
  sync_cursor?: string;
};

type PlaidItem = {
  id: string;
  itemId: string;
  userId: string;
  status: string;
  error?: string | null;
  lastErrorAt?: Date | null;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
  };
};

type LogContext = {
  requestId?: string;
  timestamp: string;
  path: string;
  method: string;
  webhookType?: string;
  webhookCode?: string;
  itemId?: string;
  userId?: string;
  newTransactionsCount?: number;
  removedTransactionCount?: number;
  syncCursor?: string;
  error?: string;
  stack?: string;
};

class PlaidWebhookController {
  public static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const requestBody = req.body as WebhookPayload;
      const requestId = (req as any).id || 'unknown';
      const timestamp = req.headers['plaid-verification'] as string;

      const logContext: LogContext = {
        requestId,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        webhookType: requestBody.webhook_type,
        webhookCode: requestBody.webhook_code,
        itemId: requestBody.item_id,
      };

      logger.info('Received Plaid webhook', logContext);

      // Route to the appropriate handler based on webhook type
      switch (requestBody.webhook_type) {
        case 'ITEM':
          return this.handleItemWebhook(req, res, next);
        case 'TRANSACTIONS':
          return this.handleTransactionsWebhook(req, res, next);
        default:
          logger.warn(`Unhandled webhook type: ${requestBody.webhook_type}`, logContext);
          return sendSuccessResponse(res, { message: 'Webhook received but not processed' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing webhook', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }

  public static async handleItemWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    const requestBody = req.body as WebhookPayload;
    const logContext: LogContext = {
      requestId: req.headers['plaid-request-id'] as string,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      webhookType: requestBody.webhook_type,
      webhookCode: requestBody.webhook_code,
      itemId: requestBody.item_id,
    };

    try {
      const {
        webhook_type: webhookType,
        webhook_code: webhookCode,
        item_id: itemId,
        error: errorData,
      } = requestBody;

      logger.info(`Processing item webhook: ${webhookCode}`, { ...logContext, webhookType, webhookCode });

      if (!itemId) {
        logger.error('Missing item_id in webhook payload', logContext);
        return sendErrorResponse(res, 400, 'Missing item_id in webhook payload');
      }

      // Find the item in the database
      const item = await prisma.plaidItem.findUnique({
        where: { itemId },
        include: { user: true },
      });

      if (!item) {
        logger.warn(`Received webhook for unknown item: ${itemId}`, logContext);
        return sendSuccessResponse(res, { message: 'Item not found' });
      }

      // Update log context with user ID
      logContext.userId = item.userId;

      // Process the webhook based on its type
      switch (webhookCode) {
        case 'ERROR':
          if (requestBody.error) {
            await this.handleItemError(item, requestBody.error, logContext);
          }
          break;
        case 'PENDING_EXPIRATION':
          await this.handlePendingExpiration(item, logContext);
          break;
        case 'USER_PERMISSION_REVOKED':
          await this.handleUserPermissionRevoked(item, logContext);
          break;
        default:
          logger.warn(`Unhandled item webhook code: ${webhookCode}`, logContext);
          return sendErrorResponse(res, 400, `Unhandled webhook code: ${webhookCode}`);
      }

      return sendSuccessResponse(res, { message: 'Item webhook processed successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing item webhook', {
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }

  public static async handleTransactionsWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    const requestBody = req.body as WebhookPayload;
    const logContext: LogContext = {
      requestId: req.headers['plaid-request-id'] as string,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      webhookType: requestBody.webhook_type,
      webhookCode: requestBody.webhook_code,
      itemId: requestBody.item_id,
    };

    try {
      const {
        webhook_type: webhookType,
        webhook_code: webhookCode,
        item_id: itemId,
        new_transactions: newTransactionsCount,
        removed_transactions: removedTransactionIds = [],
        sync_cursor: syncCursor,
        error: errorData,
      } = requestBody;

      // Update log context with transaction-specific fields
      Object.assign(logContext, {
        webhookType,
        webhookCode,
        newTransactionsCount,
        removedTransactionCount: removedTransactionIds.length,
        syncCursor,
      });

      logger.info('Processing transactions webhook', logContext);

      if (!itemId) {
        logger.error('Missing item_id in transaction webhook', logContext);
        return sendErrorResponse(res, 400, 'Missing item_id in webhook payload');
      }

      // Find the item in the database
      const item = await prisma.plaidItem.findUnique({
        where: { itemId },
        include: { user: true },
      });

      if (!item) {
        logger.warn(`Received webhook for unknown item: ${itemId}`, logContext);
        return sendSuccessResponse(res, { message: 'Item not found' });
      }

      // Update log context with user ID
      logContext.userId = item.userId;

      // Process the webhook based on its type
      switch (webhookCode) {
        case 'SYNC_UPDATES_AVAILABLE':
          logger.info('Sync updates available', { ...logContext, newTransactionsCount });
          if (newTransactionsCount && newTransactionsCount > 0) {
            await this.processTransactionUpdate(item, requestBody, logContext);
          }
          break;

        case 'INITIAL_UPDATE':
        case 'HISTORICAL_UPDATE':
          logger.info(`Processing ${webhookCode} webhook`, logContext);
          await this.processTransactionUpdate(item, requestBody, logContext);
          break;

        case 'TRANSACTIONS_REMOVED':
          logger.info('Processing removed transactions', logContext);
          await this.processRemovedTransactions(item, removedTransactionIds, logContext);
          break;

        case 'ERROR':
          logger.error('Error in transaction webhook', { ...logContext, error: errorData });
          await prisma.plaidItem.update({
            where: { id: item.id },
            data: {
              status: 'ERROR',
              error: errorData ? JSON.stringify(errorData) : null,
              lastErrorAt: new Date(),
            },
          });
          break;

        default:
          logger.warn(`Unhandled transaction webhook code: ${webhookCode}`, logContext);
          return sendSuccessResponse(res, { message: 'Webhook processed - unhandled code' });
      }

      return sendSuccessResponse(res, { message: 'Transaction webhook processed successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing transactions webhook', {
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }

  public static async verifyWebhookRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const timestamp = req.headers['plaid-timestamp'] as string;
      const signature = req.headers['plaid-signature'] as string;
      const requestId = req.headers['plaid-request-id'] as string;
      const body = req.body;

      if (!timestamp || !signature || !requestId) {
        throw new BadRequestError('Missing required headers');
      }

      // Verify the timestamp is not too old (5 minutes)
      const maxTimeDrift = 5 * 60 * 1000; // 5 minutes in milliseconds
      const requestTime = new Date(timestamp).getTime();
      const currentTime = Date.now();

      if (Math.abs(currentTime - requestTime) > maxTimeDrift) {
        throw new BadRequestError('Request timestamp is too old');
      }

      // Verify the webhook signature
      const webhookSecret = process.env.PLAID_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('PLAID_WEBHOOK_SECRET is not configured');
      }

      const isValid = this.verifyWebhookSignature(
        signature,
        webhookSecret,
        JSON.stringify(body)
      );

      if (!isValid) {
        throw new UnauthorizedError('Invalid webhook signature');
      }

      // Add the request ID to the request object for logging
      (req as any).id = requestId;
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error verifying webhook request', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }

  public static async processTransactionUpdate(
    item: PlaidItem,
    data: {
      new_transactions?: number;
      sync_cursor?: string;
    },
    logContext: LogContext
  ): Promise<void> {
    try {
      const newTransactions = data.new_transactions || 0;
      if (newTransactions === 0) {
        logger.info('No new transactions to process', logContext);
        return;
      }

      logger.info('Processing transaction update', {
        ...logContext,
        newTransactions,
        syncCursor: data.sync_cursor
      });

      // TODO: Implement transaction update logic
      // This would typically involve:
      // 1. Fetching the latest transactions from Plaid
      // 2. Processing and normalizing the transaction data
      // 3. Saving the transactions to the database
      // 4. Updating any related data (categories, accounts, etc.)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing transaction update', {
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public static async processRemovedTransactions(
    item: PlaidItem,
    removedTransactionIds: string[],
    logContext: LogContext
  ): Promise<void> {
    try {
      if (!removedTransactionIds || removedTransactionIds.length === 0) {
        logger.info('No transactions to remove', logContext);
        return;
      }

      logger.info(`Processing ${removedTransactionIds.length} removed transactions`, logContext);

      // Mark transactions as removed in the database
      await prisma.transaction.updateMany({
        where: { plaidTransactionId: { in: removedTransactionIds } },
        data: { isRemoved: true, updatedAt: new Date() },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing removed transactions', {
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public static async handleItemError(
    item: PlaidItem,
    errorData: PlaidError,
    logContext: LogContext
  ): Promise<void> {
    try {
      logger.info('Handling item error', { ...logContext, errorData });

      // Update item status to error
      await prisma.plaidItem.update({
        where: { id: item.id },
        data: { error: errorData.error_message, updatedAt: new Date() },
      });

      // TODO: Notify user about the error
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error handling item error', {
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public static async handlePendingExpiration(
    item: PlaidItem,
    logContext: LogContext
  ): Promise<void> {
    try {
      logger.info('Handling pending expiration', logContext);

      // TODO: Implement pending expiration logic
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error handling pending expiration', {
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public static async handleUserPermissionRevoked(
    item: PlaidItem,
    logContext: LogContext
  ): Promise<void> {
    try {
      logger.info('Handling user permission revoked', logContext);

      // TODO: Implement user permission revoked logic
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error handling user permission revoked', {
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public static verifyWebhookSignature(
    signature: string,
    secret: string,
    body: string | Buffer
  ): boolean {
    try {
      // Create a signed payload string from the request body
      const hmac = crypto.createHmac('sha256', secret);
      const bodyString = typeof body === 'string' ? body : body.toString();
      const signedPayload = `${signature}.${bodyString}`;
      const computedSignature = hmac.update(signedPayload).digest('hex');

      // Compare the computed signature with the provided signature
      return crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      );
    } catch (error) {
      logger.error('Error verifying webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

// Export controller methods as a plain object to avoid TypeScript issues with static methods
export const plaidWebhookController = {
  handleWebhook: PlaidWebhookController.handleWebhook,
  handleItemWebhook: PlaidWebhookController.handleItemWebhook,
  handleTransactionsWebhook: PlaidWebhookController.handleTransactionsWebhook,
  verifyWebhookRequest: PlaidWebhookController.verifyWebhookRequest,
  verifyWebhookSignature: PlaidWebhookController.verifyWebhookSignature,
  processTransactionUpdate: PlaidWebhookController.processTransactionUpdate,
  processRemovedTransactions: PlaidWebhookController.processRemovedTransactions,
  handleItemError: PlaidWebhookController.handleItemError,
  handlePendingExpiration: PlaidWebhookController.handlePendingExpiration,
  handleUserPermissionRevoked: PlaidWebhookController.handleUserPermissionRevoked,
};
