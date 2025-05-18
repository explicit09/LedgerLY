import { SecretsManager } from 'aws-sdk';
import { AWSConfig } from '../../config/aws.config';
import { logger } from '../../utils/logger';
import { getSecretId, isSecretAccessAllowed } from './secret-config';

/**
 * Service for securely accessing secrets from AWS Secrets Manager
 * with built-in caching and audit logging
 */
export class AwsSecretsService {
  private secretsManager: SecretsManager;
  private static instance: AwsSecretsService;
  private secretCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.secretsManager = new SecretsManager({
      region: AWSConfig.region,
      // Local development can use AWS credentials from environment or AWS config
      ...(process.env.NODE_ENV === 'development' && {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }),
    });
  }

  /**
   * Get singleton instance of AwsSecretsService
   */
  public static getInstance(): AwsSecretsService {
    if (!AwsSecretsService.instance) {
      AwsSecretsService.instance = new AwsSecretsService();
    }
    return AwsSecretsService.instance;
  }

  /**
   * Log secret access for audit purposes
   */
  /**
   * Logs secret access for audit purposes
   */
  private logSecretAccess(secretId: string, action: string, success: boolean): void {
    const logData: Record<string, any> = {
      service: 'AwsSecretsService',
      action,
      secretId: this.redactSecretId(secretId),
      success,
      timestamp: new Date().toISOString(),
      environment: AWSConfig.environment || process.env.NODE_ENV,
      sourceIp: process.env.AWS_LAMBDA_FUNCTION_NAME ? 'lambda' : 'ec2/ecs',
    };
    
    // Add request ID in Lambda environment
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      logData.awsRequestId = process.env.AWS_LAMBDA_INITIALIZATION_TYPE
        ? 'initialization'
        : 'invocation';
    }
    
    // Log at appropriate level
    if (success) {
      logger.info('SecretsManager Access', logData);
    } else {
      logger.error('SecretsManager Access Failed', logData);
    }
  }

  /**
   * Redact parts of the secret ID for logging
   */
  /**
   * Redacts sensitive parts of a secret ID for logging
   */
  private redactSecretId(secretId: string): string {
    if (!secretId) return '***';
    
    try {
      // Handle different secret ID formats
      if (secretId.startsWith('arn:aws:secretsmanager')) {
        // Full ARN format
        const arnParts = secretId.split(':');
        const secretName = arnParts[arnParts.length - 1];
        const nameParts = secretName.split('/');
        
        if (nameParts.length > 1) {
          const env = nameParts[0];
          const lastPart = nameParts[nameParts.length - 1];
          return `${env}/***/${lastPart}`;
        }
        return `arn:aws:secretsmanager:${arnParts[3]}:${arnParts[4]}:secret:***`;
      }
      
      // Simple path format
      const parts = secretId.split('/');
      if (parts.length > 2) {
        // Keep first and last part, redact middle
        return `${parts[0]}/***/${parts[parts.length - 1]}`;
      } else if (parts.length === 2) {
        // For two-part paths, just show the first letter of the second part
        return `${parts[0]}/${
          parts[1].length > 2 
            ? `${parts[1].substring(0, 1)}***${parts[1].substring(parts[1].length - 1)}`
            : '***'
        }`;
      }
      
      // For single-part IDs, just show the first and last character
      return secretId.length > 2 
        ? `${secretId[0]}***${secretId[secretId.length - 1]}`
        : '***';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error redacting secret ID', { 
        error: errorMessage, 
        secretId: this.redactSecretId(secretId) 
      });
      return '***';
    }
  }
  
  /**
   * Redacts sensitive values in an object for logging
   */
  private redactSecretValue(value: any): any {
    if (value === null || value === undefined) return value;
    
    // Handle primitives
    if (typeof value !== 'object') {
      if (typeof value === 'string' && value.length > 8) {
        return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
      }
      return '***';
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.redactSecretValue(item));
    }
    
    // Handle objects
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();
      
      // Redact sensitive fields
      if ([
        'password', 'secret', 'key', 'token', 'auth', 'credential', 
        'api_key', 'apikey', 'private', 'certificate', 'pem'
      ].some(sensitive => lowerKey.includes(sensitive))) {
        result[key] = '***';
      } else {
        result[key] = this.redactSecretValue(val);
      }
    }
    
    return result;
  }

  /**
   * Get a secret from AWS Secrets Manager
   * @param secretId The ID or ARN of the secret
   * @returns The secret value as type T
   */
  /**
   * Get a secret from AWS Secrets Manager with environment-aware handling
   * @param secretName The name of the secret (will be prefixed with environment)
   * @param options Optional configuration
   * @returns The secret value as type T
   */
  public async getSecret<T>(
    secretName: string,
    options: {
      /** Whether to use environment prefix (default: true) */
      useEnvPrefix?: boolean;
      /** Whether to throw an error if the secret is not found (default: true) */
      required?: boolean;
    } = {}
  ): Promise<T | null> {
    const { useEnvPrefix = true, required = true } = options;
    
    // Get the environment-specific secret ID
    const secretId = useEnvPrefix ? getSecretId(secretName) : secretName;
    
    // Validate access to this secret
    if (!isSecretAccessAllowed(secretId)) {
      const error = new Error(`Access to secret '${secretId}' is not allowed in this environment`);
      logger.error('Unauthorized secret access attempt', {
        secretId,
        error: error.message,
        environment: AWSConfig.environment,
      });
      
      if (required) {
        throw error;
      }
      return null;
    }
    try {
      // Check cache first
      const cached = this.secretCache.get(secretId);
      if (cached && Date.now() < cached.expiresAt) {
        this.logSecretAccess(secretId, 'getSecret (cached)', true);
        return cached.value as T;
      }

      // Get from AWS Secrets Manager
      const result = await this.secretsManager
        .getSecretValue({ SecretId: secretId })
        .promise();

      let secretValue: string;
      if ('SecretString' in result) {
        secretValue = result.SecretString || '';
      } else {
        secretValue = Buffer.from(result.SecretBinary as any, 'base64').toString('ascii');
      }

      const parsedValue = JSON.parse(secretValue) as T;
      
      // Update cache
      this.secretCache.set(secretId, {
        value: parsedValue,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      this.logSecretAccess(secretId, 'getSecret', true);
      
      // Ensure we don't accidentally expose the raw secret in logs
      const secretForLogging = this.redactSecretValue(parsedValue);
      logger.debug('Successfully retrieved secret', {
        secretId: this.redactSecretId(secretId),
        secretType: typeof parsedValue === 'object' ? 'object' : typeof parsedValue,
        secretPreview: JSON.stringify(secretForLogging).substring(0, 100) + (JSON.stringify(secretForLogging).length > 100 ? '...' : '')
      });
      
      return parsedValue;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logSecretAccess(secretId, 'getSecret', false);
      
      logger.error('Failed to retrieve secret', {
        error: errorMessage,
        secretId: this.redactSecretId(secretId),
        stack: errorStack,
      });
      
      throw new Error(`Failed to retrieve secret: ${errorMessage}`);
    }
  }
}

// Export singleton instance
export const awsSecretsService = AwsSecretsService.getInstance();
