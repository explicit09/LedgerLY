import { 
  CountryCode, 
  Products, 
  AccountBase, 
  AccountType, 
  AccountSubtype,
  Transaction as PlaidTransaction,
  TransactionPaymentChannelEnum,
  TransactionCode,
  PersonalFinanceCategory,
  Location,
  PaymentMeta,
  Item,
  TransactionsGetResponse as PlaidTransactionsGetResponse
} from 'plaid';

/**
 * Configuration for initializing the Plaid client
 */
export interface PlaidConfig {
  clientId: string;
  secret: string;
  env: 'sandbox' | 'development' | 'production';
  version?: string;
  clientName?: string;
  countryCodes?: CountryCode[];
  products?: Products[];
  language?: string;
}

/**
 * Parameters for generating a Plaid Link token
 */
export interface PlaidLinkTokenParams {
  userId: string;
  clientName?: string;
  products?: string[];
  countryCodes?: string[];
  language?: string;
  webhook?: string;
  accessToken?: string;
}

/**
 * Parameters for exchanging a public token
 */
export interface PlaidExchangeTokenParams {
  publicToken: string;
  metadata?: Record<string, any>;
}

/**
 * Parameters for fetching transactions
 */
export interface PlaidTransactionParams {
  accessToken: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  count?: number;
  offset?: number;
  includePersonalFinanceCategory?: boolean;
}

/**
 * Represents a financial account from Plaid
 */
export interface Account extends Omit<AccountBase, 'type' | 'subtype' | 'official_name' | 'mask' | 'balances'> {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
    unofficial_currency_code: string | null;
    limit: number | null;
  };
}

/**
 * Represents a financial transaction from Plaid
 */
export interface Transaction {
  // Core transaction data
  transactionId: string;
  accountId: string;
  accountName?: string;
  accountOfficialName?: string | null;
  
  // Amount and currency
  amount: number;
  isoCurrencyCode: string | null;
  unofficialCurrencyCode: string | null;
  
  // Date and time
  date: string; // YYYY-MM-DD
  datetime: string | null; // ISO 8601
  authorizedDate: string | null; // YYYY-MM-DD
  authorizedDatetime: string | null; // ISO 8601
  
  // Transaction details
  name: string | null;
  merchant_name: string | null;
  merchant_entity_id: string | null;
  logo_url: string | null;
  website: string | null;
  payment_channel: TransactionPaymentChannelEnum;
  pending: boolean;
  pending_transaction_id: string | null;
  account_owner: string | null;
  transaction_code: TransactionCode | null;
  check_number: string | null;
  
  // Transaction categorization
  category: string[] | null;
  category_id: string | null;
  personal_finance_category: PersonalFinanceCategory | null;
  
  // Additional metadata
  transaction_type: string | null;
  original_description: string | null;
  // Map to Prisma schema field names
  authorizedAccountId: string | null;
  transactionMetadata: Record<string, any> | null;
  
  // Payment metadata
  payment_meta: PaymentMeta | null;
  
  // Location data
  location: Location | null;
  
  // Plaid metadata
  plaid_metadata: {
    account_id: string;
    account_owner: string | null;
    pending_transaction_id: string | null;
    payment_channel: string;
    pending: boolean;
    transaction_id: string;
    transaction_type: string | null;
  };
}

/**
 * Response from the transactions API
 */
export interface TransactionResponse {
  accounts?: Account[];
  transactions: Transaction[];
  totalTransactions: number;
  requestId: string;
  itemId: string;
  pagination: {
    total: number;
    count: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Extended Plaid error with response details
 */
export interface PlaidError extends Error {
  response?: {
    data: {
      error_type: string;
      error_code: string;
      error_message: string;
      display_message?: string;
      request_id?: string;
    };
    status: number;
    headers: Record<string, string>;
  };
  request_id?: string;
}
