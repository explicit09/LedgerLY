/**
 * Environment-specific secret configuration
 * 
 * This module provides functions to handle environment-specific secret paths
 * and configurations.
 */

import { AWSConfig } from '../../config/aws.config';

/**
 * Gets the environment-specific secret ID
 * @param secretName The base name of the secret (e.g., 'database/credentials')
 * @returns The full secret path including environment prefix
 */
export function getSecretId(secretName: string): string {
  // Remove any leading slashes
  const cleanName = secretName.replace(/^\/+/, '');
  
  // Get the environment from config or fallback to NODE_ENV
  const env = AWSConfig.environment || process.env.NODE_ENV || 'development';
  
  // If the secret already has an environment prefix, use it as-is
  if (cleanName.startsWith(`${env}/`)) {
    return cleanName;
  }
  
  // Otherwise, prefix with the environment
  return `${env}/${cleanName}`;
}

/**
 * Gets the secret ID for a specific environment (for cross-environment access)
 * @param secretName The base name of the secret
 * @param targetEnv The target environment
 * @returns The full secret path for the specified environment
 */
export function getSecretIdForEnv(secretName: string, targetEnv: string): string {
  // Remove any leading slashes and environment prefixes
  const cleanName = secretName.replace(/^\/+/, '').replace(/^(dev|staging|prod)\//, '');
  return `${targetEnv}/${cleanName}`;
}

/**
 * Gets the secret prefix for the current environment
 * @returns The environment prefix (e.g., 'development/', 'staging/', 'production/')
 */
export function getSecretPrefix(): string {
  const env = AWSConfig.environment || process.env.NODE_ENV || 'development';
  return `${env}/`;
}

/**
 * Validates if a secret ID is allowed to be accessed in the current environment
 * @param secretId The full secret ID to validate
 * @returns boolean indicating if access is allowed
 */
export function isSecretAccessAllowed(secretId: string): boolean {
  const currentEnv = AWSConfig.environment || process.env.NODE_ENV || 'development';
  
  // Allow access to shared secrets (no environment prefix)
  if (!secretId.includes('/')) {
    return true;
  }
  
  // Allow access to current environment's secrets
  if (secretId.startsWith(`${currentEnv}/`)) {
    return true;
  }
  
  // Allow access to shared secrets under the common prefix
  if (process.env.AWS_SECRETS_PREFIX && secretId.startsWith(process.env.AWS_SECRETS_PREFIX)) {
    return true;
  }
  
  // Deny access to other environments' secrets
  return false;
}
