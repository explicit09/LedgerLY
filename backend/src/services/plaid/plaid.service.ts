import { 
  Configuration, 
  PlaidApi, 
  PlaidEnvironments, 
  Products, 
  CountryCode,
  PlaidError as PlaidApiError,
  TransactionsGetResponse,
  Transaction as PlaidTransaction,
  AccountBase,
  AccountType,
  AccountSubtype,
  AccountBalance,
  PaymentMeta,
  Location as PlaidLocation,
  PersonalFinanceCategory as PlaidPersonalFinanceCategory,
} from 'plaid';
import { prisma } from '../../lib/prisma';
import { encryptionService } from '../../utils/encryption';
import { 
  AppError, 
  BadRequestError, 
  NotFoundError, 
  PlaidItemError, 
  PlaidInstitutionError, 
  PlaidApiError as PlaidApiErrorClass, 
  PlaidRateLimitError,
  RateLimitError
} from '../../errors/AppError';
import { logger } from '../../utils/logger';
import { setTimeout } from 'timers/promises';
import { 
  PlaidConfig, 
  PlaidLinkTokenParams, 
  PlaidTransactionParams, 
  Transaction, 
  TransactionResponse, 
  PlaidError,
  Account,
} from './plaid.types';

/**
 * Service for handling Plaid API interactions
 */
export class PlaidService {
  private readonly client: PlaidApi;
  private readonly config: PlaidConfig;

  /**
   * Creates a new PlaidService instance
   * @param config Configuration for the Plaid client
   */
  constructor(config: PlaidConfig) {
    if (!config.clientId || !config.secret) {
      throw new BadRequestError('Plaid client ID and secret are required');
    }

    this.config = {
      ...config,
      countryCodes: config.countryCodes || [CountryCode.Us],
      products: config.products || [Products.Transactions],
      clientName: config.clientName || 'LedgerLY',
      version: config.version || '2020-09-14',
      language: config.language || 'en',
    };

    const configuration = new Configuration({
      basePath: PlaidEnvironments[this.config.env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': this.config.clientId,
          'PLAID-SECRET': this.config.secret,
          'Plaid-Version': this.config.version,
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  /**
   * Creates a link token for initializing the Plaid Link component
   * @param params Parameters for creating a link token
   * @returns The link token
   * @throws {AppError} If the link token cannot be created
   */
  async createLinkToken(params: PlaidLinkTokenParams): Promise<string> {
    try {
      // Ensure we have default values for required fields
      const clientName = params.clientName || this.config.clientName || 'LedgerLY';
      const products = (params.products as Products[]) || this.config.products || [];
      const countryCodes = (params.countryCodes as CountryCode[]) || this.config.countryCodes || [];
      const language = params.language || this.config.language || 'en';

      const response = await this.client.linkTokenCreate({
        client_name: clientName,
        user: {
          client_user_id: params.userId,
        },
        products,
        country_codes: countryCodes,
        language,
        webhook: params.webhook,
        access_token: params.accessToken,
      });

      return response.data.link_token;
    } catch (error: unknown) {
      const appError = this.handlePlaidError(error, 'Failed to create link token');
      throw appError;
    }
  }

  /**
   * Exchanges a public token for an access token
   * @param publicToken The public token to exchange
   * @returns The access token and item ID
   * @throws {AppError} If the token exchange fails
   */
  async exchangePublicToken(publicToken: string): Promise<{ 
    accessToken: string; 
    itemId: string;
    requestId: string;
  }> {
    if (!publicToken) {
      throw new BadRequestError('Public token is required');
    }

    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
        requestId: response.data.request_id,
      };
    } catch (error: unknown) {
      const appError = this.handlePlaidError(error, 'Failed to exchange public token');
      throw appError;
    }
  }

  /**
   * Retrieves transactions for an item with pagination and error handling
   * @param params Parameters for fetching transactions
   * @returns The transactions and associated accounts in a standardized format
   * @throws {AppError} If transactions cannot be retrieved
   */
  async getTransactions(params: PlaidTransactionParams): Promise<TransactionResponse> {
    try {
      const { accessToken, startDate, endDate, count = 100, offset = 0, includePersonalFinanceCategory = true } = params;

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      const maxDays = 730; // ~2 years, Plaid's max range

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestError('Invalid date format. Please use YYYY-MM-DD');
      }

      if (start > end) {
        throw new BadRequestError('Start date must be before end date');
      }

      if ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) > maxDays) {
        throw new BadRequestError(`Date range cannot exceed ${maxDays} days`);
      }

      if (end > today) {
        throw new BadRequestError('End date cannot be in the future');
      }

      // Make the API request
      const response = await this.client.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          count,
          offset,
          include_personal_finance_category: includePersonalFinanceCategory,
        },
      });

      // Transform accounts to our format with proper null checks
      const accounts: Account[] = (response.data.accounts || []).map(account => {
        // Ensure we have a valid balances object with all required fields
        const balances = {
          available: account.balances?.available ?? null,
          current: account.balances?.current ?? null,
          iso_currency_code: account.balances?.iso_currency_code ?? null,
          unofficial_currency_code: account.balances?.unofficial_currency_code ?? null,
          limit: account.balances?.limit ?? null,
        };

        return {
          account_id: account.account_id,
          name: account.name,
          official_name: account.official_name ?? null,
          type: account.type,
          subtype: account.subtype ?? null,
          mask: account.mask ?? null,
          balances
        };
      });

      // Transform transactions to our format with proper null checks
      const transactions: Transaction[] = (response.data.transactions || []).map(tx => {
        const account = accounts.find(a => a.account_id === tx.account_id);
        
        // Create transaction object with all required fields
        const transaction: Transaction = {
          transactionId: tx.transaction_id,
          accountId: tx.account_id,
          accountName: account?.name,
          accountOfficialName: account?.official_name ?? null,
          amount: tx.amount,
          isoCurrencyCode: tx.iso_currency_code ?? null,
          unofficialCurrencyCode: tx.unofficial_currency_code ?? null,
          date: tx.date,
          datetime: tx.datetime ?? null,
          authorizedDate: tx.authorized_date ?? null,
          authorizedDatetime: tx.authorized_datetime ?? null,
          name: tx.name ?? null,
          merchant_name: tx.merchant_name ?? null,
          merchant_entity_id: tx.merchant_entity_id ?? null,
          logo_url: tx.logo_url ?? null,
          website: tx.website ?? null,
          payment_channel: tx.payment_channel,
          pending: tx.pending,
          pending_transaction_id: tx.pending_transaction_id ?? null,
          account_owner: tx.account_owner ?? null,
          transaction_code: tx.transaction_code ?? null,
          check_number: tx.check_number ?? null,
          payment_meta: tx.payment_meta ?? null,
          location: tx.location ?? null,
          personal_finance_category: tx.personal_finance_category ?? null,
          category: tx.category ?? null,
          category_id: tx.category_id ?? null,
          transaction_type: tx.transaction_type ?? null,
          original_description: tx.original_description ?? null,
          authorizedAccountId: null, // Not available in the Plaid response
          transactionMetadata: null, // Not available in the Plaid response
          plaid_metadata: {
            account_id: tx.account_id,
            account_owner: tx.account_owner ?? null,
            pending_transaction_id: tx.pending_transaction_id ?? null,
            payment_channel: tx.payment_channel,
            pending: tx.pending,
            transaction_id: tx.transaction_id,
            transaction_type: tx.transaction_type ?? null,
          },
        };

        return transaction;
      });

      return {
        accounts,
        transactions,
        totalTransactions: response.data.total_transactions,
        requestId: response.data.request_id,
        itemId: response.data.item.item_id,
        pagination: {
          total: response.data.total_transactions,
          count: transactions.length,
          offset,
          hasMore: response.data.total_transactions > offset + transactions.length,
        },
      };
    } catch (error: unknown) {
      const appError = this.handlePlaidError(error, 'Failed to fetch transactions');
      throw appError;
    }
  }

  /**
   * Retrieves information about an institution
   * @param institutionId The Plaid institution ID
   * @returns The institution information
   * @throws {AppError} If the institution cannot be found
   */
  async getInstitution(institutionId: string) {
    try {
      const response = await this.client.institutionsGetById({
        institution_id: institutionId,
        country_codes: this.config.countryCodes || [CountryCode.Us],
        options: {
          include_optional_metadata: true,
        },
      });

      if (!response.data.institution) {
        throw new Error('No institution data found');
      }

      return response.data.institution;
    } catch (error: unknown) {
      const appError = this.handlePlaidError(error, 'Failed to retrieve institution');
      throw appError;
    }
  }

  /**
   * Removes a Plaid item and revokes its access token
   */
  async removeItem(accessToken: string): Promise<void> {
    if (!accessToken) {
      throw new BadRequestError('Access token is required');
    }

    try {
      await this.withRetry(
        () => this.client.itemRemove({ access_token: accessToken }),
        'removeItem'
      );
    } catch (error: unknown) {
      const appError = this.handlePlaidError(error, 'Failed to remove item');
      throw appError;
    }
  }

  /**
   * Handles Plaid API errors consistently
   * @param error The error that occurred
   * @param defaultMessage The default error message to use if none is provided
   * @returns {AppError} With appropriate error details
   * @private
   */
  /**
   * Executes a function with retry logic for transient failures
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    operation: string,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        const caughtError = error instanceof Error ? error : new Error(String(error));
        lastError = caughtError;
        
        // Don't retry for non-retryable errors
        if (
          caughtError instanceof BadRequestError || 
          caughtError instanceof PlaidItemError ||
          caughtError instanceof PlaidInstitutionError
        ) {
          throw caughtError;
        }
        
        // For rate limits, use the retry-after header if available
        if (error instanceof RateLimitError) {
          const retryAfter = (error as PlaidRateLimitError).retryAfter || 60; // Default to 60 seconds
          logger.warn(`Rate limited on attempt ${attempt}/${maxRetries} for ${operation}. Retrying in ${retryAfter}ms`, {
            attempt,
            maxRetries,
            retryAfter,
            error: error.message
          });
          await setTimeout(retryAfter * 1000);
          continue;
        }
        
        // For other errors, use exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt}/${maxRetries} failed for ${operation}. Retrying in ${delay}ms`, {
          attempt,
          maxRetries,
          delay,
          error: caughtError.message
        });
        
        if (attempt < maxRetries) {
          await setTimeout(delay + Math.random() * 1000); // Add jitter
        }
      }
    }
    
    // If we get here, all retries failed
    logger.error(`All ${maxRetries} attempts failed for ${operation}`, { error: lastError });
    throw lastError || new Error(`Failed to execute ${operation} after ${maxRetries} attempts`);
  }

  /**
   * Handles Plaid API errors and converts them to appropriate application errors
   */
  private handlePlaidError(error: unknown, defaultMessage: string, requestId?: string): never {
    // If it's already an AppError, just rethrow
    if (error instanceof AppError) {
      throw error;
    }
    
    // Ensure we have an Error object
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Handle different types of Plaid errors
    const plaidError = error as {
      response?: {
        data?: {
          error_type?: string;
          error_code?: string;
          error_message?: string;
          display_message?: string;
          request_id?: string;
        };
        headers?: {
          'plaid-version'?: string;
          'retry-after'?: string;
        };
        status?: number;
      };
      data?: {
        error_type?: string;
        error_code?: string;
        error_message?: string;
        display_message?: string;
        request_id?: string;
      };
      message?: string;
    };

    // Extract error data from either response.data or directly from error.data
    const errorData = plaidError.response?.data || plaidError.data || {};
    const errorType = errorData.error_type || 'API_ERROR';
    const errorCode = errorData.error_code;
    const errorMessage = errorData.display_message || errorData.error_message || plaidError.message || defaultMessage;
    const reqId = requestId || errorData.request_id || 'unknown';
    
    // Get retry-after header if available
    const retryAfter = plaidError.response?.headers?.['retry-after'] 
      ? parseInt(plaidError.response.headers['retry-after'], 10) 
      : undefined;

    // Log the error for debugging
    logger.error('Plaid API error', {
      errorType,
      errorCode,
      errorMessage,
      requestId: reqId,
      retryAfter,
      status: plaidError.response?.status,
      stack: errorObj.stack
    });

    // Map Plaid error types to application errors
    switch (errorType) {
      case 'INVALID_REQUEST':
      case 'INVALID_INPUT':
        throw new BadRequestError(errorMessage);
        
      case 'RATE_LIMIT_EXCEEDED':
        throw new PlaidRateLimitError(
          'Too many requests to Plaid API',
          retryAfter,
          reqId
        );
        
      case 'ITEM_ERROR':
        throw new PlaidItemError(
          errorMessage,
          errorCode,
          reqId
        );
        
      case 'INSTITUTION_ERROR':
        throw new PlaidInstitutionError(
          errorMessage,
          errorCode,
          reqId
        );
        
      case 'API_ERROR':
      default:
        throw new PlaidApiErrorClass(
          errorMessage,
          errorCode,
          reqId
        );
    }
  }
}

// Export a singleton instance
export const plaidService = new PlaidService({
  clientId: process.env.PLAID_CLIENT_ID!,
  secret: process.env.PLAID_SECRET!,
  env: (process.env.PLAID_ENV as 'sandbox' | 'development' | 'production') || 'sandbox',
});
