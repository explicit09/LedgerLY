import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export interface CashFlowItem {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface TrendItem {
  date: string;
  net: number;
}

/**
 * Service providing analytics calculations for dashboard
 */
export class AnalyticsService {
  /**
   * Get monthly cash flow between two dates
   */
  async getMonthlyCashFlow(userId: string, startDate: Date, endDate: Date): Promise<CashFlowItem[]> {
    const rows = await prisma.$queryRaw<Array<{ month: Date; income: number; expenses: number }>>`
      SELECT date_trunc('month', "date") AS month,
             SUM(CASE WHEN amount >= 0 THEN amount ELSE 0 END) AS income,
             SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS expenses
        FROM "Transaction"
       WHERE "userId" = ${userId}
         AND "date" BETWEEN ${startDate} AND ${endDate}
       GROUP BY 1
       ORDER BY 1`;

    return rows.map(r => ({
      month: r.month.toISOString().slice(0, 7),
      income: Number(r.income),
      expenses: Number(r.expenses),
      net: Number(r.income) - Number(r.expenses),
    }));
  }

  /**
   * Get running net cash trend by day
   */
  async getNetCashTrend(userId: string, startDate: Date, endDate: Date): Promise<TrendItem[]> {
    const rows = await prisma.$queryRaw<Array<{ day: Date; net: number }>>`
      SELECT date_trunc('day', "date") AS day,
             SUM(amount) AS net
        FROM "Transaction"
       WHERE "userId" = ${userId}
         AND "date" BETWEEN ${startDate} AND ${endDate}
       GROUP BY 1
       ORDER BY 1`;

    let running = 0;
    return rows.map(r => {
      running += Number(r.net);
      return { date: r.day.toISOString().slice(0, 10), net: running };
    });
  }

  /**
   * List active recurring transactions for a user
   */
  async getRecurringTransactions(userId: string) {
    return prisma.recurringTransaction.findMany({
      where: { userId, isActive: true },
      include: { transactions: true, category: true, account: true },
    });
  }

  /**
   * Aggregate expenses by category
   */
  async getExpensesByCategory(userId: string, startDate: Date, endDate: Date) {
    const rows = await prisma.$queryRaw<Array<{ category: string | null; amount: number }>>`
      SELECT c.name AS category,
             SUM(ABS(t.amount)) AS amount
        FROM "Transaction" t
        LEFT JOIN "Category" c ON t."categoryId" = c.id
       WHERE t."userId" = ${userId}
         AND t.amount < 0
         AND t.date BETWEEN ${startDate} AND ${endDate}
       GROUP BY c.name
       ORDER BY amount DESC`;

    return rows.map(r => ({
      category: r.category || 'Uncategorized',
      amount: Number(r.amount),
    }));
  }

  /**
   * Aggregate expenses by merchant (using description field)
   */
  async getExpensesByMerchant(userId: string, startDate: Date, endDate: Date) {
    const rows = await prisma.$queryRaw<Array<{ merchant: string; amount: number }>>`
      SELECT t.description AS merchant,
             SUM(ABS(t.amount)) AS amount
        FROM "Transaction" t
       WHERE t."userId" = ${userId}
         AND t.amount < 0
         AND t.date BETWEEN ${startDate} AND ${endDate}
       GROUP BY t.description
       ORDER BY amount DESC`;

    return rows.map(r => ({
      merchant: r.merchant,
      amount: Number(r.amount),
    }));
  }
}

export const analyticsService = new AnalyticsService();
