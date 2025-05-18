import { Request, Response, NextFunction } from 'express';
import { plaidService } from '../services/plaid';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { encryptionService } from '../utils/encryption';
import { sendSuccessResponse, sendErrorResponse } from '../utils/apiResponse';
import { AppError, BadRequestError, NotFoundError, UnauthorizedError } from '../errors/AppError';

// Use the Prisma client directly
// The Prisma client is already properly typed in prisma.ts

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Controller for handling Plaid-related requests
 */
export class PlaidController {
  /**
   * Generate a Link token for initializing the Plaid Link component
   */
  static async createLinkToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      // Check if the user already has linked items
      const existingItems = await prisma.plaidItem.findMany({
        where: { userId },
        select: { id: true },
      });

      const linkToken = await plaidService.createLinkToken({
        userId,
        webhook: process.env.PLAID_WEBHOOK_URL,
        accessToken: existingItems.length > 0 ? undefined : undefined,
      });

      sendSuccessResponse(res, { linkToken });
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exchange a public token for an access token
   */
  /**
   * Exchange a public token for an access token and link a new Plaid item
   */
  static async exchangePublicToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { publicToken, institutionId, institutionName } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      if (!publicToken) {
        throw new BadRequestError('Public token is required');
      }

      if (!institutionId || !institutionName) {
        throw new BadRequestError('Institution ID and name are required');
      }

      // Check if the institution is already linked to this user
      const existingInstitution = await prisma.plaidItem.findFirst({
        where: { userId, institutionId },
        select: { id: true },
      });

      if (existingInstitution) {
        throw new BadRequestError('This institution is already linked to your account');
      }

      // Exchange the public token for an access token
      const { accessToken, itemId, requestId } = await plaidService.exchangePublicToken(publicToken);

      // Store the access token securely
      const encryptedAccessToken = encryptionService.encrypt(accessToken);

      // Check if the Plaid item is already linked to any user
      const existingItem = await prisma.plaidItem.findFirst({
        where: { itemId },
        select: { id: true },
      });

      if (existingItem) {
        throw new BadRequestError('This bank account is already linked to another user');
      }

      // Create the Plaid item
      const plaidItem = await prisma.plaidItem.create({
        data: {
          itemId,
          accessToken: encryptedAccessToken,
          institutionId,
          institutionName,
          userId,
          status: 'ACTIVE',
          lastSyncedAt: new Date(),
        },
      });

      // Log the successful linking
      console.log(`User ${userId} successfully linked Plaid item ${itemId} for ${institutionName} (Request ID: ${requestId})`);

      // Return success response with additional metadata
      sendSuccessResponse(res, { 
        itemId: plaidItem.id,
        plaidItemId: itemId,
        institutionId: plaidItem.institutionId,
        institutionName: plaidItem.institutionName,
        status: plaidItem.status,
        requestId,
        message: 'Bank account linked successfully',
      });
    } catch (error) {
      console.error('Error exchanging public token:', error);
      next(error);
    }
  }

  /**
   * Get transactions for a linked item
   */
  static async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { itemId } = req.params;
      const { startDate, endDate, count, offset } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      if (!itemId) {
        throw new BadRequestError('Item ID is required');
      }

      // Get the Plaid item
      const plaidItem = await prisma.plaidItem.findFirst({
        where: { 
          id: itemId as string,
          userId 
        },
      });

      if (!plaidItem) {
        throw new NotFoundError('Plaid item not found');
      }

      // Decrypt the access token
      const accessToken = encryptionService.decrypt(plaidItem.accessToken);

      // Get transactions from Plaid
      const transactions = await plaidService.getTransactions({
        accessToken,
        startDate: startDate as string,
        endDate: endDate as string,
        count: count ? parseInt(count as string) : 100,
        offset: offset ? parseInt(offset as string) : 0,
      });

      sendSuccessResponse(res, transactions);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all linked Plaid items for the current user
   */
  static async getLinkedItems(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const items = await prisma.plaidItem.findMany({
        where: { userId },
        select: {
          id: true,
          itemId: true,
          institutionId: true,
          institutionName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      sendSuccessResponse(res, { success: true });
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a linked Plaid item
   */
  static async removeItem(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { itemId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      if (!itemId) {
        throw new BadRequestError('Item ID is required');
      }

      // Delete the Plaid item
      await prisma.plaidItem.deleteMany({
        where: { 
          id: itemId,
          userId 
        },
      });

      return sendSuccessResponse(res, { message: 'Plaid item removed successfully' });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return sendSuccessResponse(res, { message: 'Plaid item not found or already removed' });
      }
      next(error);
    }
  }
}

export default PlaidController;
