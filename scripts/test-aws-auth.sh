#!/bin/bash

# Exit on error
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  # Export all variables except those with spaces or special characters
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
  # Source the file to ensure all variables are available
  set -a
  source .env
  set +a
  echo "Loaded environment variables from .env file"
else
  echo "Error: .env file not found in the project root"
  exit 1
fi

echo "=== Testing AWS Authentication ==="

# 1. Test AWS credentials
echo -e "\n1. Testing AWS credentials..."
aws sts get-caller-identity

# 2. Test AWS CLI permissions
echo -e "\n2. Testing AWS CLI permissions..."
aws iam list-attached-user-policies --user-name $(aws sts get-caller-identity --query 'Arn' --output text | awk -F'/' '{print $NF}') --output table

# 3. Test Secrets Manager access
echo -e "\n3. Testing Secrets Manager access..."
aws secretsmanager list-secrets --region $AWS_REGION --max-items 1

# 4. Test specific secret access
echo -e "\n4. Testing specific secret access..."
SECRET_NAME="development/database/credentials"

echo "Trying to access secret: $SECRET_NAME"
aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --region "$AWS_REGION" --query 'SecretString' --output text

# 5. Test with full ARN
SECRET_ARN=$(aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" --query 'ARN' --output text)
echo -e "\n5. Testing with full ARN: $SECRET_ARN"
aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --region "$AWS_REGION" --query 'SecretString' --output text

# 6. Check IAM permissions
echo -e "\n6. Checking IAM permissions..."
POLICY_ARN=$(aws iam list-attached-user-policies --user-name $(aws sts get-caller-identity --query 'Arn' --output text | awk -F'/' '{print $NF}') --query 'AttachedPolicies[0].PolicyArn' --output text)

if [ "$POLICY_ARN" != "None" ]; then
  echo "Current user has policy: $POLICY_ARN"
  echo -e "\nPolicy document:"
  aws iam get-policy-version --policy-arn "$POLICY_ARN" --version-id $(aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.DefaultVersionId' --output text) --query 'PolicyVersion.Document'
else
  echo "No policies attached to the current user"
fi

echo -e "\n=== Test Complete ==="
echo -e "\nIf you see any errors above, please check the following:"
echo "1. Your AWS credentials are valid and have the necessary permissions"
echo "2. The IAM user has the 'secretsmanager:GetSecretValue' permission"
echo "3. The secret exists in the specified region"
echo "4. The IAM user has the 'secretsmanager:ListSecrets' permission"
