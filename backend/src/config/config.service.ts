import { awsSecretsService } from '../services/secrets';
import { logger } from '../utils/logger';

/**
 * Interface for database configuration
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  url: string;
}

/**
 * Interface for JWT configuration
 */
export interface JwtConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

/**
 * Interface for Plaid configuration
 */
export interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'development' | 'production';
  webhookUrl?: string;
}

/**
 * Interface for AWS configuration
 */
export interface AwsConfig {
  region: string;
  accountId: string;
  secretsPrefix: string;
}

/**
 * Interface for application configuration
 */
export interface AppConfig {
  environment: string;
  port: number;
  logLevel: string;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

/**
 * Configuration service that loads and caches configuration values
 * from environment variables and AWS Secrets Manager
 */
export class ConfigService {
  private static instance: ConfigService;
  private config: {
    app: AppConfig | null;
    database: DatabaseConfig | null;
    jwt: JwtConfig | null;
    plaid: PlaidConfig | null;
    aws: AwsConfig | null;
  } = {
    app: null,
    database: null,
    jwt: null,
    plaid: null,
    aws: null,
  };

  private constructor() {}

  /**
   * Get singleton instance of ConfigService
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Get application configuration
   */
  getAppConfig(): AppConfig {
    if (!this.config.app) {
      const nodeEnv = process.env.NODE_ENV || 'development';
      const isProduction = nodeEnv === 'production';
      const isDevelopment = !isProduction;
      const isTest = nodeEnv === 'test';

      this.config.app = {
        environment: nodeEnv,
        port: parseInt(process.env.PORT || '3000', 10),
        logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
        nodeEnv,
        isProduction,
        isDevelopment,
        isTest,
      };
    }
    return this.config.app;
  }

  /**
   * Get database configuration
   */
  async getDatabaseConfig(): Promise<DatabaseConfig> {
    if (!this.config.database) {
      try {
        const secret = await awsSecretsService.getSecret<{
          DB_HOST: string;
          DB_PORT: string;
          DB_USER: string;
          DB_PASSWORD: string;
          DB_NAME: string;
          DATABASE_URL?: string;
        }>('database/credentials');

        if (!secret) {
          throw new Error('Database configuration not found in secrets');
        }

        // Use DATABASE_URL if provided, otherwise construct it
        const databaseUrl = secret.DATABASE_URL || 
          `postgresql://${secret.DB_USER}:${secret.DB_PASSWORD}@${secret.DB_HOST}:${secret.DB_PORT}/${secret.DB_NAME}`;

        this.config.database = {
          host: secret.DB_HOST,
          port: parseInt(secret.DB_PORT, 10),
          username: secret.DB_USER,
          password: secret.DB_PASSWORD,
          database: secret.DB_NAME,
          url: databaseUrl,
        };
      } catch (error) {
        logger.error('Failed to load database configuration', { error });
        throw new Error('Failed to load database configuration');
      }
    }
    return this.config.database;
  }

  /**
   * Get JWT configuration
   */
  async getJwtConfig(): Promise<JwtConfig> {
    if (!this.config.jwt) {
      try {
        const secret = await awsSecretsService.getSecret<{
          JWT_SECRET: string;
          JWT_EXPIRES_IN: string;
          JWT_ISSUER?: string;
          JWT_AUDIENCE?: string;
        }>('auth/jwt');

        if (!secret) {
          throw new Error('JWT configuration not found in secrets');
        }

        this.config.jwt = {
          secret: secret.JWT_SECRET,
          expiresIn: secret.JWT_EXPIRES_IN || '1d',
          issuer: secret.JWT_ISSUER || 'ledgerly',
          audience: secret.JWT_AUDIENCE || 'ledgerly-client',
        };
      } catch (error) {
        logger.error('Failed to load JWT configuration', { error });
        throw new Error('Failed to load JWT configuration');
      }
    }
    return this.config.jwt;
  }

  /**
   * Get Plaid configuration
   */
  async getPlaidConfig(): Promise<PlaidConfig> {
    if (!this.config.plaid) {
      try {
        const secret = await awsSecretsService.getSecret<{
          PLAID_CLIENT_ID: string;
          PLAID_SECRET: string;
          PLAID_ENV: 'sandbox' | 'development' | 'production';
          PLAID_WEBHOOK_URL?: string;
        }>('integrations/plaid');

        if (!secret) {
          throw new Error('Plaid configuration not found in secrets');
        }

        this.config.plaid = {
          clientId: secret.PLAID_CLIENT_ID,
          secret: secret.PLAID_SECRET,
          environment: secret.PLAID_ENV,
          webhookUrl: secret.PLAID_WEBHOOK_URL,
        };
      } catch (error) {
        logger.error('Failed to load Plaid configuration', { error });
        throw new Error('Failed to load Plaid configuration');
      }
    }
    return this.config.plaid;
  }

  /**
   * Get AWS configuration
   */
  getAwsConfig(): AwsConfig {
    if (!this.config.aws) {
      this.config.aws = {
        region: process.env.AWS_REGION || 'us-east-1',
        accountId: process.env.AWS_ACCOUNT_ID || '',
        secretsPrefix: process.env.AWS_SECRETS_PREFIX || '/ledgerly/',
      };
    }
    return this.config.aws;
  }

  /**
   * Get all configurations (useful for debugging)
   */
  async getAllConfigs() {
    return {
      app: this.getAppConfig(),
      database: await this.getDatabaseConfig(),
      jwt: await this.getJwtConfig(),
      plaid: await this.getPlaidConfig(),
      aws: this.getAwsConfig(),
    };
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
