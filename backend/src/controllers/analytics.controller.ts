import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics';
import { sendSuccessResponse } from '../utils/apiResponse';

export class AnalyticsController {
  static async cashFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const { start, end } = req.query;
      const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end as string) : new Date();
      const data = await analyticsService.getMonthlyCashFlow(userId, startDate, endDate);
      sendSuccessResponse(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async netCashTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const { start, end } = req.query;
      const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end as string) : new Date();
      const data = await analyticsService.getNetCashTrend(userId, startDate, endDate);
      sendSuccessResponse(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async recurring(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const data = await analyticsService.getRecurringTransactions(userId);
      sendSuccessResponse(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async expensesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const { start, end } = req.query;
      const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end as string) : new Date();
      const data = await analyticsService.getExpensesByCategory(userId, startDate, endDate);
      sendSuccessResponse(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async expensesByMerchant(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const { start, end } = req.query;
      const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end as string) : new Date();
      const data = await analyticsService.getExpensesByMerchant(userId, startDate, endDate);
      sendSuccessResponse(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export default AnalyticsController;
