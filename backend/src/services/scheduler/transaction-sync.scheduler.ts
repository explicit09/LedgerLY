import { CronJob } from 'cron';
import { prisma } from '../../lib/prisma';
import { plaidService } from '../plaid';
import { transactionService } from '../transaction';
import { encryptionService } from '../../utils/encryption';
import { logger } from '../../utils/logger';

/**
 * Scheduler for syncing transactions from Plaid
 */
class TransactionSyncScheduler {
  private syncJob: CronJob | null = null;
  private isRunning = false;

  /**
   * Start the transaction sync scheduler
   * @param cronExpression Cron expression for scheduling (default: every hour)
   */
  public start(cronExpression = '0 * * * *'): void {
    if (this.syncJob) {
      logger.info('Transaction sync scheduler is already running');
      return;
    }

    this.syncJob = new CronJob(
      cronExpression,
      async () => {
        if (this.isRunning) {
          logger.info('Transaction sync is already in progress, skipping this run');
          return;
        }

        try {
          this.isRunning = true;
          logger.info('Starting scheduled transaction sync');
          await this.syncAllAccounts();
          logger.info('Completed scheduled transaction sync');
        } catch (error) {
          logger.error('Error during scheduled transaction sync:', error);
        } finally {
          this.isRunning = false;
        }
      },
      null, // onComplete
      true, // start immediately
      'UTC' // timezone
    );

    logger.info(`Transaction sync scheduler started with cron expression: ${cronExpression}`);
  }

  /**
   * Stop the transaction sync scheduler
   */
  public stop(): void {
    if (this.syncJob) {
      this.syncJob.stop();
      this.syncJob = null;
      logger.info('Transaction sync scheduler stopped');
    }
  }

  /**
   * Sync transactions for all linked accounts
   */
  private async syncAllAccounts(): Promise<void> {
    try {
      // Get all active Plaid items
      const plaidItems = await prisma.plaidItem.findMany({
        where: {
          // Add any additional filters for active items if needed
        },
      });

      if (plaidItems.length === 0) {
        logger.info('No Plaid items found for transaction sync');
        return;
      }

      logger.info(`Syncing transactions for ${plaidItems.length} Plaid items`);

      // Process each Plaid item
      for (const item of plaidItems) {
        try {
          await this.syncTransactionsForItem(item);
        } catch (error) {
          logger.error(`Error syncing transactions for Plaid item ${item.id}:`, error);
          // Continue with the next item even if one fails
          continue;
        }
      }
    } catch (error) {
      logger.error('Error in transaction sync job:', error);
      throw error;
    }
  }

  /**
   * Sync transactions for a single Plaid item
   * @param plaidItem The Plaid item to sync transactions for
   */
  private async syncTransactionsForItem(plaidItem: any): Promise<void> {
    try {
      const { id: itemId, accessToken: encryptedAccessToken, lastSyncAt } = plaidItem;
      
      // Decrypt the access token
      const accessToken = encryptionService.decrypt(encryptedAccessToken);
      
      // Calculate date range (use configured lookback days for initial sync, or since last sync)
      const endDate = new Date().toISOString().split('T')[0];
      const lookbackDays = parseInt(process.env.TRANSACTION_SYNC_LOOKBACK_DAYS || '30', 10);
      const startDate = lastSyncAt 
        ? new Date(lastSyncAt).toISOString().split('T')[0]
        : new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      logger.info(`Syncing transactions for Plaid item ${itemId} from ${startDate} to ${endDate}`);

      // Fetch transactions from Plaid
      const { transactions } = await plaidService.getTransactions({
        accessToken,
        startDate,
        endDate,
        count: 500, // Maximum allowed by Plaid
      });

      if (transactions.length === 0) {
        logger.info(`No new transactions found for Plaid item ${itemId}`);
        return;
      }

      logger.info(`Found ${transactions.length} transactions for Plaid item ${itemId}`);

      // Process transactions (save to database, categorize, etc.)
      await this.processTransactions(transactions, plaidItem.userId, itemId);

      // Update the last sync time
      await prisma.plaidItem.update({
        where: { id: itemId },
        data: { lastSyncAt: new Date() },
      });

      logger.info(`Successfully synced ${transactions.length} transactions for Plaid item ${itemId}`);
    } catch (error) {
      logger.error(`Error syncing transactions for Plaid item ${plaidItem.id}:`, error);
      throw error;
    }
  }

  /**
   * Process and save transactions to the database
   * @param plaidTransactions Transactions from Plaid API
   * @param userId User ID
   * @param plaidItemId Plaid item ID
   */
  private async processTransactions(
    plaidTransactions: any[],
    userId: string,
    plaidItemId: string
  ): Promise<void> {
    try {
      // Transform Plaid transactions to our format
      const transactions = plaidTransactions.map(tx => ({
        id: tx.transaction_id,
        accountId: tx.account_id,
        amount: tx.amount,
        date: new Date(tx.date),
        name: tx.name,
        merchantName: tx.merchant_name || tx.name,
        category: tx.category || null,
        pending: tx.pending,
        plaidTransactionId: tx.transaction_id,
        plaidItemId,
        userId,
      }));

      // Process transactions using the transaction service
      const result = await transactionService.processTransactions({
        transactions,
        userId,
        plaidItemId,
      });

      logger.info('Processed transactions', {
        added: result.added,
        updated: result.updated,
        skipped: result.skipped,
        total: transactions.length,
        plaidItemId,
        userId,
      });

      // If we have transactions, detect recurring patterns
      if (transactions.length > 1) {
        const recurringCandidates = transactionService.detectRecurringTransactions(
          transactions.map(tx => ({
            id: tx.id,
            name: tx.name,
            amount: tx.amount,
            date: tx.date,
          })),
          userId
        );

        if (recurringCandidates.length > 0) {
          logger.info(`Detected ${recurringCandidates.length} potential recurring transactions`, {
            plaidItemId,
            userId,
            recurringCandidates: recurringCandidates.map(rc => ({
              name: rc.name,
              amount: rc.amount,
              frequency: rc.frequency,
              count: rc.transactionIds.length,
            })),
          });

          // Here you could save the recurring transactions to the database
          // or trigger any other business logic
        }
      }
    } catch (error) {
      logger.error('Error processing transactions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        plaidItemId,
        userId,
      });
      throw error;
    }
  }
}

// Export a singleton instance
export const transactionSyncScheduler = new TransactionSyncScheduler();
