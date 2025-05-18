# AWS Secrets Manager Integration

This document outlines how AWS Secrets Manager is integrated into the LedgerLY backend to securely manage and access sensitive configuration data.

## Overview

The application uses AWS Secrets Manager to store and retrieve sensitive configuration such as:

- Database credentials
- JWT secrets and configuration
- Third-party API keys (e.g., Plaid)
- Other sensitive environment variables

## Configuration

### Required Environment Variables

Ensure the following environment variables are set in your `.env` file or deployment environment:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_ACCOUNT_ID=your-aws-account-id

# Optional: Custom secrets prefix (defaults to environment name)
AWS_SECRETS_PREFIX=/ledgerly/

# Application Configuration
NODE_ENV=development # or production, staging, etc.
LOG_LEVEL=info
```

### Secret Naming Convention

Secrets are stored in AWS Secrets Manager using the following naming convention:

```
{environment}/{service}/{secret-name}
```

Example:
```
development/database/credentials
development/auth/jwt
production/plaid/credentials
```

## Available Secrets

### Database Credentials

**Secret Path:** `{environment}/database/credentials`

**Format:**
```json
{
  "DB_HOST": "database-host",
  "DB_PORT": "5432",
  "DB_USER": "database-user",
  "DB_PASSWORD": "database-password",
  "DB_NAME": "database-name",
  "DATABASE_URL": "optional-connection-string"
}
```

### JWT Configuration

**Secret Path:** `{environment}/auth/jwt`

**Format:**
```json
{
  "JWT_SECRET": "your-jwt-secret-key",
  "JWT_EXPIRES_IN": "1d",
  "JWT_ISSUER": "ledgerly",
  "JWT_AUDIENCE": "ledgerly-client"
}
```

### Plaid Configuration

**Secret Path:** `{environment}/integrations/plaid`

**Format:**
```json
{
  "PLAID_CLIENT_ID": "your-plaid-client-id",
  "PLAID_SECRET": "your-plaid-secret",
  "PLAID_ENV": "sandbox",
  "PLAID_WEBHOOK_URL": "optional-webhook-url"
}
```

## Usage in Application

### Accessing Secrets

Use the `configService` to access configuration values:

```typescript
import { configService } from '../config';

// Get database configuration
const dbConfig = await configService.getDatabaseConfig();

// Get JWT configuration
const jwtConfig = await configService.getJwtConfig();

// Get Plaid configuration
const plaidConfig = await configService.getPlaidConfig();
```

### Direct Secret Access (Advanced)

For advanced use cases, you can access secrets directly using the `awsSecretsService`:

```typescript
import { awsSecretsService } from '../services/secrets';

// Get a secret
const secret = await awsSecretsService.getSecret('auth/jwt');

// Get a secret with a specific version
const secretWithVersion = await awsSecretsService.getSecret('auth/jwt', 'AWSCURRENT');
```

## Local Development

For local development, you can use the AWS CLI to set up test secrets:

```bash
# Create a test secret
aws secretsmanager create-secret \
  --name development/database/credentials \
  --secret-string '{"DB_HOST":"localhost","DB_PORT":"5432","DB_USER":"postgres","DB_PASSWORD":"postgres","DB_NAME":"ledgerly_dev"}'

# Update an existing secret
aws secretsmanager update-secret \
  --secret-id development/database/credentials \
  --secret-string '{"DB_HOST":"localhost","DB_PORT":"5432","DB_USER":"postgres","DB_PASSWORD":"new-password","DB_NAME":"ledgerly_dev"}'

# Get a secret value
aws secretsmanager get-secret-value --secret-id development/database/credentials
```

## Testing

To test the AWS Secrets Manager integration, run:

```bash
# Test AWS Secrets Manager integration
npm run test:secrets

# Or directly with ts-node
npx ts-node scripts/test-aws-secrets.ts
```

## Security Considerations

1. **Least Privilege**: The IAM role/user should have the minimum permissions required to access only the necessary secrets.
2. **Secret Rotation**: Implement secret rotation for all sensitive credentials.
3. **Audit Logging**: Enable AWS CloudTrail to log all Secrets Manager API calls.
4. **Encryption**: All secrets are encrypted at rest using AWS KMS.
5. **Access Control**: Use IAM policies to control access to secrets based on the principle of least privilege.

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure the IAM user/role has the `secretsmanager:GetSecretValue` permission.
   - Check if the secret exists in the specified region.

2. **Secret Not Found**
   - Verify the secret name and path are correct.
   - Ensure the secret is in the correct AWS region.

3. **Invalid JSON**
   - Ensure the secret value is valid JSON.
   - Check for trailing commas or other JSON syntax errors.

### Logging

Set the `LOG_LEVEL` environment variable to `debug` for more detailed logging:

```bash
export LOG_LEVEL=debug
```

## Deployment

### AWS Infrastructure

The following AWS resources are required:

1. **Secrets Manager**: To store and manage secrets.
2. **KMS Key**: For encrypting secrets at rest.
3. **IAM Policies**: To control access to secrets.

### CI/CD Integration

Update your CI/CD pipeline to include the necessary AWS credentials with permissions to access the required secrets.

### Environment Setup

Ensure all required environment variables are set in your deployment environment or CI/CD pipeline.
