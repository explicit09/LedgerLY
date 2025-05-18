# LedgerLY Infrastructure

This directory contains the infrastructure as code (IaC) and deployment scripts for the LedgerLY application.

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Required environment variables set in `.env` file
3. The following tools installed:
   - `aws` CLI
   - `jq` (for JSON processing)
   - `bash` (version 4.0+)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
ENVIRONMENT=development  # or staging/production

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public

# JWT
JWT_SECRET=your-jwt-secret

# Plaid
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox  # or development/production
```

## Deployment

### 1. Deploy All Infrastructure

To deploy all infrastructure components (IAM policies, secrets, etc.):

```bash
./scripts/deploy-infrastructure.sh
```

This will:
1. Deploy IAM policies
2. Set up secrets in AWS Secrets Manager
3. Create a test script to verify the setup

### 2. Deploy Individual Components

#### IAM Policies

```bash
./scripts/setup-iam-policy.sh
```

#### Secrets

```bash
./scripts/setup-secrets.sh
```

## Verifying the Deployment

After deployment, a test script will be created at the root of the project. Run it to verify secret access:

```bash
./test-secret-access.sh
```

## Security Considerations

1. **Secrets Management**:
   - Never commit actual secrets to version control
   - Use different secrets for different environments
   - Rotate secrets regularly

2. **IAM Policies**:
   - Follow the principle of least privilege
   - Regularly review and audit IAM policies

3. **Audit Logging**:
   - All secret access is logged to CloudWatch
   - Set up alerts for unauthorized access attempts

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure your AWS credentials have the necessary permissions
   - Check if your IAM user has the required IAM permissions

2. **Secret Not Found**
   - Verify the secret exists in the correct region
   - Check the secret name and environment prefix

3. **Invalid Secret Format**
   - Ensure secrets are properly formatted as JSON strings

## Best Practices

1. **Environment Separation**:
   - Use separate AWS accounts or namespaces for different environments
   - Never share secrets between environments

2. **Secret Rotation**:
   - Implement automatic secret rotation for database credentials
   - Rotate API keys and tokens regularly

3. **Monitoring**:
   - Set up CloudWatch Alarms for failed secret access attempts
   - Monitor IAM policy changes with AWS Config

## Clean Up

To remove all created resources:

1. Delete the secrets from AWS Secrets Manager
2. Delete the IAM policies from IAM console
3. Remove any CloudWatch log groups if no longer needed
