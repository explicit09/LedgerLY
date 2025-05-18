import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, PlaidError as PlaidSdkError } from 'plaid';
import { prisma } from '../../lib/prisma';
import { encryptionService } from '../../utils/encryption';
import { AppError, BadRequestError, NotFoundError } from '../../errors/AppError';
import { PlaidConfig, PlaidLinkTokenParams, PlaidExchangeTokenParams, PlaidTransactionParams } from './plaid.types';

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
      const response = await this.client.linkTokenCreate({
        user: { client_user_id: params.userId },
        client_name: this.config.clientName!,
        products: this.config.products!,
        country_codes: this.config.countryCodes!,
        language: this.config.language!,
        webhook: params.webhook,
        access_token: params.accessToken,
      });

      return response.data.link_token;
    } catch (error) {
      this.handlePlaidError(error, 'Failed to create link token');
    }
  }

  /**
   * Exchanges a public token for an access token
   * @param publicToken The public token to exchange
   * @returns The access token and item ID
   * @throws {AppError} If the token exchange fails
   */
  async exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      };
    } catch (error) {
      this.handlePlaidError(error, 'Failed to exchange public token');
    }
  }

  /**
   * Retrieves transactions for an item
   * @param params Parameters for fetching transactions
   * @returns The transactions and associated accounts
   * @throws {AppError} If transactions cannot be retrieved
   */
  async getTransactions(params: PlaidTransactionParams) {
    try {
      const response = await this.client.transactionsGet({
        access_token: params.accessToken,
        start_date: params.startDate,
        end_date: params.endDate,
        options: {
          count: params.count || 100,
          offset: params.offset || 0,
        },
      });

      return {
        accounts: response.data.accounts,
        transactions: response.data.transactions,
        totalTransactions: response.data.total_transactions,
        item: response.data.item,
      };
    } catch (error) {
      this.handlePlaidError(error, 'Failed to retrieve transactions');
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
        country_codes: this.config.countryCodes!,
        options: {
          include_optional_metadata: true,
        },
      });

      return response.data.institution;
    } catch (error) {
      this.handlePlaidError(error, 'Failed to retrieve institution');
    }
  }

  /**
   * Handles Plaid API errors consistently
   * @param error The error that occurred
   * @param defaultMessage The default error message to use if none is provided
   * @throws {AppError} With appropriate error details
   * @private
   */
  private handlePlaidError(error: unknown, defaultMessage: string): never {
    if (error instanceof AppError) {
      throw error;
    }

    const plaidError = error as PlaidSdkError;
    const errorData = (plaidError as any).response?.data || (plaidError as any).data;

    if (errorData) {
      const { error_type, error_message, display_message } = errorData;
      const message = display_message || error_message || defaultMessage;
      
      switch (error_type) {
        case 'INVALID_INPUT':
        case 'INVALID_REQUEST':
          throw new BadRequestError(message);
        case 'RATE_LIMIT_EXCEEDED':
          throw new AppError('Rate limit exceeded', 429);
        case 'API_ERROR':
          throw new AppError('Plaid API error', 500);
        case 'ITEM_ERROR':
          throw new AppError(message, 400);
        case 'INSTITUTION_ERROR':
          throw new AppError(message, 503);
        default:
          throw new AppError(message, 500);
      }
    }

    throw new AppError(defaultMessage, 500);
  }
}

// Export a singleton instance
export const plaidService = new PlaidService({
  clientId: process.env.PLAID_CLIENT_ID!,
  secret: process.env.PLAID_SECRET!,
  env: (process.env.PLAID_ENV as 'sandbox' | 'development' | 'production') || 'sandbox',
});
