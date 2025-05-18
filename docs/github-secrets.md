# GitHub Secrets and Environment Variables

This document outlines all the secrets and environment variables required for the LedgerLY CI/CD pipeline.

## Environment Setup

The repository uses two environments:
1. `staging` - For testing and validation
2. `production` - For live deployment

Each environment has its own set of secrets and requires approval for deployments.

## Required Secrets

### AWS Authentication
- `AWS_ROLE_ARN` - ARN of the IAM role to assume for AWS operations
  - Format: `arn:aws:iam::<account-id>:role/github-actions-role`
  - Used for: AWS authentication via OIDC

### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://<username>:<password>@<host>:<port>/<database>`
  - Used for: Backend database connection
- `DB_USERNAME` - Database admin username
  - Used for: RDS instance creation
- `DB_PASSWORD` - Database admin password
  - Used for: RDS instance creation

### Application Secrets
- `JWT_SECRET` - Secret key for JWT token signing
  - Must be at least 32 characters long
  - Used for: User authentication
- `STRIPE_SECRET_KEY` - Stripe API secret key
  - Format: `sk_test_...` (staging) or `sk_live_...` (production)
  - Used for: Payment processing
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
  - Format: `pk_test_...` (staging) or `pk_live_...` (production)
  - Used for: Frontend Stripe integration
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
  - Used for: Verifying Stripe webhook authenticity

### AWS Resource Identifiers
- `FRONTEND_BUCKET` - Name of the S3 bucket for frontend assets
  - Format: `ledgerly-<environment>-frontend`
- `CLOUDFRONT_DISTRIBUTION_ID` - ID of the CloudFront distribution
  - Used for: Cache invalidation after deployments
- `ECR_REGISTRY` - Amazon ECR registry URL
  - Format: `<account-id>.dkr.ecr.<region>.amazonaws.com`
- `ECR_REPOSITORY` - Name of the ECR repository
  - Format: `ledgerly-<environment>-backend`
- `ECS_CLUSTER` - Name of the ECS cluster
  - Format: `ledgerly-<environment>`
- `ECS_SERVICE` - Name of the ECS service
  - Format: `ledgerly-<environment>-backend`

## Secret Rotation

1. **Database Credentials**
   - Rotate every 90 days
   - Update `DATABASE_URL` in GitHub Secrets
   - Update RDS instance password
   - Update any local development `.env` files

2. **JWT Secret**
   - Rotate every 180 days
   - Update `JWT_SECRET` in GitHub Secrets
   - Deploy with zero-downtime strategy
   - Invalidate existing sessions (users will need to log in again)

3. **Stripe Keys**
   - Rotate API keys every 90 days
   - Use key rotation in Stripe Dashboard
   - Update both `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`
   - Update `STRIPE_WEBHOOK_SECRET` if rotated

4. **AWS Credentials**
   - Rotate IAM role credentials every 90 days
   - Update `AWS_ROLE_ARN` if necessary
   - Rotate access keys for any service accounts

## Environment Variables

### Required for Local Development
Create a `.env` file in the `backend` directory with:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ledgerly

# Authentication
JWT_SECRET=your-secure-jwt-secret

# Stripe (test mode for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS (for local development)
AWS_REGION=us-east-1

# Plaid (for bank integration)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox  # or development/production
```

### Production Considerations
- Never commit `.env` files to version control
- Use environment-specific secret management
- Enable secret scanning in GitHub repository settings
- Restrict access to production secrets to authorized personnel only
- Monitor and audit secret usage

## Security Best Practices

1. **Secret Management**
   - Use GitHub's built-in secret encryption
   - Implement principle of least privilege for all credentials
   - Rotate secrets regularly
   - Never log or expose secrets in application logs

2. **Access Control**
   - Limit who can access repository settings
   - Require two-factor authentication for all contributors
   - Review and audit access regularly

3. **Monitoring**
   - Set up alerts for failed deployments
   - Monitor for unexpected secret usage
   - Log and audit all secret access

## Troubleshooting

### Common Issues
- **Deployment Failures**: Check secret names and permissions
- **Authentication Errors**: Verify secret values and environment variables
- **Permission Denied**: Ensure IAM roles and policies are correctly configured

### Support
For any issues with secrets or environment variables, contact the DevOps team at devops@ledgerly.com.
   - Update through AWS Secrets Manager
   - Update GitHub environment secrets

2. **JWT Secret**
   - Rotate every 180 days
   - Coordinate rotation with token expiration
   - Update in both environments

3. **Stripe Keys**
   - Rotate when compromised or team changes
   - Generate new keys in Stripe Dashboard
   - Update in GitHub environments

4. **AWS IAM Role**
   - Review permissions quarterly
   - Rotate if compromised
   - Update GitHub environment secrets

## Setting Up Secrets

1. Go to repository Settings > Secrets and variables > Actions
2. Create environments `staging` and `production`
3. Add required secrets to each environment
4. Set up environment protection rules:
   - Required reviewers for production
   - Deployment branch restrictions
   - Wait timer for production deployments

## Security Best Practices

1. Use environment protection rules
2. Never expose secrets in logs
3. Rotate secrets regularly
4. Use least privilege principle
5. Audit secret access regularly
6. Use AWS Secrets Manager for sensitive data
7. Enable required reviewers for production
8. Monitor secret usage in Actions logs 