import { Request, Response, NextFunction } from 'express';

import { transactionService } from '../services/transaction';
import { UnauthorizedError } from '../errors/AppError';

function toCsv(records: any[]): string {
  if (records.length === 0) {
    return '';
  }
  const header = [
    'date',
    'description',
    'amount',
    'category'
  ];
  const lines = records.map(tx => {
    const vals = [
      tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
      tx.description || '',
      tx.amount != null ? tx.amount : '',
      tx.category || ''
    ];
    return vals.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });
  return header.join(',') + '\n' + lines.join('\n');
}

export class TransactionController {
  static async exportCsv(req: Request, res: Response, next: NextFunction) {

    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const { transactions } = await transactionService.getTransactions({
        userId,
        page: 1,
        limit: 10000,
        startDate: start,
        endDate: end
      });

      const csv = toCsv(transactions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      res.send(csv);
    } catch (err) {
      next(err);

    }
  }
}

export default TransactionController;
