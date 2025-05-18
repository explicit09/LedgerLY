import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services';
import { sendSuccessResponse } from '../utils/apiResponse';
import { UnauthorizedError } from '../errors/AppError';

export class TransactionController {
  static async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { page, limit, startDate, endDate, category, search } = req.query;

      const result = await transactionService.getTransactions({
        userId,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        category: category as string | undefined,
        search: search as string | undefined,
      });

      sendSuccessResponse(res, result);
      return;
    } catch (error) {
      next(error);
    }
  }
}

export default TransactionController;
