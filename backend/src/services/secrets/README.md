# Secrets Management

This module provides a secure way to manage and access secrets in the LedgerLY application using AWS Secrets Manager.

## Features

- **Secure Secret Storage**: Store sensitive information like API keys and database credentials securely
- **Automatic Encryption**: Secrets are encrypted at rest and in transit
- **Caching**: Built-in caching to reduce API calls to AWS Secrets Manager
- **Audit Logging**: All secret access is logged for security and compliance
- **Type Safety**: TypeScript support for all secret values

## Usage

### Initialization

The `AwsSecretsService` is a singleton that's automatically initialized when imported:

```typescript
import { awsSecretsService } from './services/secrets';
```

### Retrieving Secrets

```typescript
// Get a secret by its ID or ARN
const databaseConfig = await awsSecretsService.getSecret<{ 
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}>('production/database/credentials');

console.log(`Connecting to database at ${databaseConfig.host}:${databaseConfig.port}`);
```

### Environment Variables

Configure the following environment variables:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# AWS Secrets Manager
AWS_SECRETS_PREFIX=/ledgerly/

# Logging
LOG_LEVEL=info
AWS_CLOUDWATCH_GROUP_NAME=/aws/ledgerly/logs
AWS_CLOUDWATCH_STREAM_PREFIX=backend
```

## Security

- All secrets are encrypted at rest using AWS KMS
- IAM policies should follow the principle of least privilege
- Secret access is logged to CloudWatch for auditing
- Local caching is encrypted in memory

## Testing

Run the tests with:

```bash
npm test
```

## Deployment

1. Ensure IAM roles have the necessary permissions
2. Set up the required secrets in AWS Secrets Manager
3. Configure environment variables in your deployment environment

## Best Practices

- Never commit secrets to version control
- Rotate secrets regularly
- Use separate secrets for different environments
- Monitor access logs for suspicious activity
