import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

type TransactionData = {
  id: string;
  accountId: string;
  amount: number;
  date: Date;
  name: string;
  merchantName?: string | null;
  category?: string[] | null;
  pending: boolean;
  plaidTransactionId: string;
  plaidItemId: string;
  userId: string;
};

type ProcessTransactionsOptions = {
  transactions: TransactionData[];
  userId: string;
  plaidItemId: string;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: Date;
};

type RecurringTransaction = {
  userId: string;
  description: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  transactionIds: string[];
};

/**
 * Service for processing and managing transactions
 */
class TransactionService {
  /**
   * Process transactions for a user and plaid item
   */
  async processTransactions(
    userId: string,
    plaidItemId: string,
    transactions: Array<{
      plaidTransactionId: string;
      description: string;
      amount: number;
      date: Date;
      category: string[];
      pending: boolean;
    }>
  ): Promise<{
    added: number;
    updated: number;
    skipped: number;
  }> {
    if (transactions.length === 0) {
      return { added: 0, updated: 0, skipped: 0 };
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    try {
      // Process transactions in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        // Process each transaction in the batch
        for (const tx of batch) {
          try {
            // Skip if required fields are missing
            if (!tx.plaidTransactionId || !tx.description || tx.amount === undefined || !tx.date) {
              logger.warn('Skipping transaction with missing required fields', { 
                transactionId: tx.plaidTransactionId,
                userId,
                plaidItemId,
              });
              skipped++;
              continue;
            }

            // Check if transaction already exists using raw SQL to avoid TypeScript errors
            const existingTxs = await prisma.$queryRaw`
              SELECT id FROM "Transaction" 
              WHERE "plaidTransactionId" = ${tx.plaidTransactionId} 
              AND "plaidItemId" = ${plaidItemId} 
              LIMIT 1
            ` as { id: string }[];
            const existingTx = existingTxs.length > 0 ? existingTxs[0] : null;

            const txData = {
              amount: tx.amount,
              type: tx.amount >= 0 ? 'INCOME' : 'EXPENSE',
              category: tx.category ? tx.category.join(', ') : null,
              description: tx.description,
              date: tx.date,
              accountId: null,
              userId,
              plaidItemId,
              plaidTransactionId: tx.plaidTransactionId,
              pending: tx.pending,
              isActive: true,
            };

            if (existingTx) {
              // Update existing transaction using raw SQL
              await prisma.$executeRaw`
                UPDATE "Transaction"
                SET 
                  amount = ${txData.amount},
                  type = ${txData.type},
                  category = ${txData.category},
                  description = ${txData.description},
                  date = ${txData.date},
                  "updatedAt" = NOW(),
                  pending = ${txData.pending}
                WHERE id = ${existingTx.id}
              `;
              updated++;
            } else {
              // Create new transaction using raw SQL
              await prisma.$executeRaw`
                INSERT INTO "Transaction" (
                  id, amount, type, category, description, date, "accountId", 
                  "userId", "plaidItemId", "plaidTransactionId", pending, "isActive", 
                  "createdAt", "updatedAt"
                ) VALUES (
                  gen_random_uuid(), ${txData.amount}, ${txData.type}, ${txData.category}, 
                  ${txData.description}, ${txData.date}, ${txData.accountId}, 
                  ${txData.userId}, ${txData.plaidItemId}, ${txData.plaidTransactionId}, 
                  ${txData.pending}, ${txData.isActive}, NOW(), NOW()
                )
              `;
              added++;
            }
          } catch (error) {
            logger.error('Error processing transaction', {
              error: error instanceof Error ? error.message : 'Unknown error',
              transactionId: tx.plaidTransactionId,
              userId,
              plaidItemId,
              stack: error instanceof Error ? error.stack : undefined,
            });
            skipped++;
          }
        }
      }

      logger.info('Processed transactions', {
        added,
        updated,
        skipped,
        total: transactions.length,
        userId,
        plaidItemId,
      });

      // After processing, detect recurring transactions and update their flags
      try {
        // Fetch all transactions for user and plaidItemId
        const allTxs = await prisma.transaction.findMany({
          where: { userId, plaidItemId },
          select: {
            id: true,
            description: true,
            amount: true,
            date: true,
          },
        });
        const recurring: RecurringTransaction[] = [];

        // Group transactions by description and amount
        const groups = allTxs.reduce((acc: Record<string, Transaction[]>, tx: Transaction) => {
          const key = `${tx.description}-${tx.amount}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(tx);
          return acc;
        }, {});

        // Analyze each group for recurring patterns
        (Object.values(groups) as Transaction[][]).forEach((group: Transaction[]) => {
          if (group.length < 2) return; // Need at least 2 transactions to detect a pattern

          // Calculate average days between transactions
          const sortedDates = group
            .map((tx: Transaction) => tx.date)
            .sort((a: Date, b: Date) => a.getTime() - b.getTime());

          const intervals: number[] = [];
          for (let i = 1; i < sortedDates.length; i++) {
            const days = Math.round(
              (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) /
                (1000 * 60 * 60 * 24)
            );
            intervals.push(days);
          }

          const avgDays =
            intervals.reduce((sum: number, days: number) => sum + days, 0) / intervals.length;

          // Only consider as recurring if we have at least 2 transactions
          // and the average interval is less than 35 days (monthly)
          if (group.length >= 2 && avgDays <= 35) {
            recurring.push({
              userId,
              description: group[0].description,
              amount: group[0].amount,
              frequency: this.determineFrequency(avgDays),
              transactionIds: group.map((tx: Transaction) => tx.id),
            });
          }
        });

        for (const rec of recurring) {
          await prisma.transaction.updateMany({
            where: { id: { in: rec.transactionIds } },
            data: {
              isRecurring: true,
              recurringFrequency: rec.frequency,
            },
          });
        }
        // Optionally, unset isRecurring for transactions not detected as recurring
        const recurringIds = recurring.flatMap((r) => r.transactionIds);
        await prisma.transaction.updateMany({
          where: {
            userId,
            plaidItemId,
            id: { notIn: recurringIds },
          },
          data: { isRecurring: false, recurringFrequency: null },
        });
      } catch (recError) {
        logger.error('Error updating recurring transaction flags', {
          error: recError instanceof Error ? recError.message : 'Unknown error',
          userId,
          plaidItemId,
        });
      }
      return { added, updated, skipped };
    } catch (error) {
      logger.error('Error in processTransactions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        plaidItemId,
      });
      throw error;
    }
  }

  /**
   * Detect recurring transactions from a list of transactions
   */
  detectRecurringTransactions(
    transactions: Transaction[],
    userId: string
  ): RecurringTransaction[] {
    if (transactions.length < 2) {
      return [];
    }

    // Analyze each group for recurring patterns
    const recurring: RecurringTransaction[] = [];

    // Group transactions by description and amount
    const groups = transactions.reduce((acc: Record<string, Transaction[]>, tx: Transaction) => {
      const key = `${tx.description}-${tx.amount}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);

    (Object.values(groups) as Transaction[][]).forEach((group: Transaction[]) => {
      if (group.length < 2) return; // Need at least 2 transactions to detect a pattern

      // Calculate average days between transactions
      const sortedDates = group
        .map((tx: Transaction) => tx.date)
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());

      const intervals: number[] = [];
      for (let i = 1; i < sortedDates.length; i++) {
        const days = Math.round(
          (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) /
            (1000 * 60 * 60 * 24)
        );
        intervals.push(days);
      }

      const avgDays =
        intervals.reduce((sum: number, days: number) => sum + days, 0) / intervals.length;

      // Only consider as recurring if we have at least 2 transactions
      // and the average interval is less than 35 days (monthly)
      if (group.length >= 2 && avgDays <= 35) {
        recurring.push({
          userId,
          description: group[0].description,
          amount: group[0].amount,
          frequency: this.determineFrequency(avgDays),
          transactionIds: group.map((tx: Transaction) => tx.id),
        });
      }
    });

    return recurring;
  }

  /**
   * Determine the frequency based on average days between transactions
   */
  private determineFrequency(avgDays: number): 'weekly' | 'biweekly' | 'monthly' {
    if (avgDays <= 7) return 'weekly';
    if (avgDays <= 14) return 'biweekly';
    return 'monthly';
  }

  /**
   * Get transactions for a user with optional filters
   */
  async getTransactions({
    userId,
    page = 1,
    limit = 50,
    startDate,
    endDate,
    category,
    search,
  }: {
    userId: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    search?: string;
  }) {
    const skip = (page - 1) * limit;
    
    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];
    
    // Always filter by user ID
    conditions.push('t."userId" = $1');
    params.push(userId);
    
    let paramIndex = params.length + 1;
    
    if (startDate) {
      conditions.push(`t.date >= $${paramIndex++}`);
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push(`t.date <= $${paramIndex++}`);
      params.push(endDate);
    }
    
    if (category) {
      conditions.push(`LOWER(t.category) LIKE $${paramIndex++}`);
      params.push(`%${category.toLowerCase()}%`);
    }
    
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(`(
        LOWER(t.description) LIKE $${paramIndex} 
        OR LOWER(t.category) LIKE $${paramIndex}
      )`);
      params.push(searchTerm);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Add pagination parameters
    const limitParam = `$${paramIndex++}`;
    const offsetParam = `$${paramIndex++}`;
    
    // Get paginated transactions with account info
    const query = `
      SELECT 
        t.*,
        json_build_object(
          'id', a.id,
          'name', a.name,
          'type', a.type
        ) as account
      FROM "Transaction" t
      LEFT JOIN "Account" a ON t."accountId" = a.id
      ${whereClause}
      ORDER BY t.date DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `;
    
    const transactions = await prisma.$queryRawUnsafe(
      query,
      ...params,
      limit,
      skip
    ) as any[];
    
    // Build and execute the count query with proper parameter binding
    const countQuery = `
      SELECT COUNT(*)::integer as count
      FROM "Transaction" t
      ${whereClause || ''}
    `;
    
    // Execute the count query with parameters (excluding limit and offset)
    const countParams = params.slice(0, Math.max(0, params.length - 2));
    const countResult = await prisma.$queryRawUnsafe(
      countQuery,
      ...countParams
    );
    
    // Extract the count from the result
    const total = (countResult as any)?.[0]?.count || 0;
    
    return {
      transactions: transactions.map(tx => ({
        ...tx,
        // Convert date strings to Date objects
        date: tx.date ? new Date(tx.date) : null,
        createdAt: tx.createdAt ? new Date(tx.createdAt) : null,
        updatedAt: tx.updatedAt ? new Date(tx.updatedAt) : null,
        // Handle case where account might be a string (JSON) or already an object
        account: tx.account 
          ? (typeof tx.account === 'string' ? JSON.parse(tx.account) : tx.account)
          : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

// Export a singleton instance
export const transactionService = new TransactionService();

// Export types
export type { TransactionData, ProcessTransactionsOptions };
