/**
 * Secrets Management Module
 * 
 * This module provides a unified interface for accessing secrets
 * from various secret management services.
 */

export { awsSecretsService } from './aws-secrets.service';
export type { AwsSecretsService } from './aws-secrets.service';

// Add other secret providers here in the future
// export { otherSecretsService } from './other-secrets.service';
