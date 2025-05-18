# CI/CD Pipeline Testing Guide

This guide explains how to use the pipeline testing script to validate the complete CI/CD pipeline for the LedgerLY application.

## Overview

The `test-pipeline.sh` script performs comprehensive testing of all components in our CI/CD pipeline, including:

- Infrastructure validation
- Deployment verification
- Security checks
- Monitoring system tests
- Rollback procedures
- Database migration testing

## Prerequisites

Before running the tests, ensure you have:

1. AWS CLI installed and configured
2. GitHub CLI installed and authenticated
3. Docker installed and running
4. PostgreSQL client installed
5. Required environment variables set in `.env.staging` or `.env.production`

## Running the Tests

Execute the script with the target environment as an argument:

```bash
./scripts/test-pipeline.sh staging
# or
./scripts/test-pipeline.sh production
```

## Test Components

### 1. Environment Validation
- Verifies all required environment variables are set
- Validates AWS credentials and permissions
- Checks GitHub authentication

### 2. Infrastructure Tests
- S3 bucket accessibility and permissions
- CloudFront distribution and SSL certificate
- ECS cluster and service health
- Load balancer configuration
- ECR repository access
- RDS instance connectivity
- VPC and networking

### 3. Security Validation
- Secrets Manager access
- SSL/TLS certificate validation
- IAM permissions verification
- Security group configurations

### 4. Database Tests
- Connection verification
- Migration status check
- Backup configuration

### 5. Monitoring Tests
- CloudWatch alarms status
- SNS topic configuration
- Notification delivery
- Metrics validation

### 6. Deployment Tests
- GitHub Actions workflow validation
- Deployment simulation
- Rollback procedure testing
- Environment variable handling

### 7. Cleanup Procedures
- Removes test artifacts
- Cleans up test containers
- Archives test logs

## Test Logs

All test output is logged to a timestamped file in the `logs/` directory. The log file name follows the format:
```
pipeline-test-YYYYMMDD_HHMMSS.log
```

## Error Handling

If any test fails:
1. The script will exit immediately
2. The error will be logged to the test log file
3. A message will direct you to check the log file for details

## Common Issues and Solutions

### AWS Access Issues
- Verify AWS credentials are correctly configured
- Check IAM permissions for the test user
- Ensure AWS region is correctly set

### Database Connection Failures
- Verify database credentials in environment file
- Check VPC security group rules
- Validate database instance status

### Deployment Failures
- Check GitHub token permissions
- Verify workflow file syntax
- Ensure all required secrets are configured

### SSL Certificate Issues
- Verify ACM certificate status
- Check domain configuration
- Validate CloudFront settings

## Maintenance

### Adding New Tests
To add new test cases:
1. Create a new function in `test-pipeline.sh`
2. Add the function call in the main execution section
3. Update this documentation

### Updating Existing Tests
When updating tests:
1. Maintain backward compatibility
2. Update relevant documentation
3. Test in staging before production

## Best Practices

1. **Regular Testing**
   - Run tests before major deployments
   - Schedule periodic validation
   - Monitor test logs for trends

2. **Security**
   - Rotate test credentials regularly
   - Review IAM permissions
   - Update security configurations

3. **Monitoring**
   - Review CloudWatch metrics
   - Check notification deliverability
   - Validate alarm configurations

## Support

For issues or questions:
1. Check the test logs for detailed error messages
2. Review AWS CloudWatch logs
3. Contact the DevOps team for assistance

## Contributing

When contributing to the testing framework:
1. Follow the existing code style
2. Add comprehensive error handling
3. Update documentation
4. Test thoroughly in staging 