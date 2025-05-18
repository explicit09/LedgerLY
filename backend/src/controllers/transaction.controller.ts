import { Request, Response, NextFunction } from 'express';

import { transactionService } from '../services/transaction';
import { prisma } from '../lib/prisma';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/AppError';
import { sendSuccessResponse } from '../utils/apiResponse';

export class TransactionController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { page = '1', limit = '50', startDate, endDate, category, search } = req.query;
      const result = await transactionService.getTransactions({
        userId,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        category: category as string | undefined,
        search: search as string | undefined,
      });

      sendSuccessResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;
      const tx = await prisma.transaction.findFirst({ where: { id, userId } });
      if (!tx) {
        throw new NotFoundError('Transaction not found');
      }

      sendSuccessResponse(res, tx);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {

    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }


      const { id } = req.params;
      const { category, description, isRecurring } = req.body;

      const tx = await prisma.transaction.findFirst({ where: { id, userId } });
      if (!tx) {
        throw new NotFoundError('Transaction not found');
      }

      const updated = await transactionService.updateTransaction(id, {
        category,
        description,
        isRecurring,
      });

      sendSuccessResponse(res, updated);
    } catch (error) {
      next(error);

    }
  }
}

export default TransactionController;
