#!/bin/bash

# Exit on error
set -e

# Load environment variables from .env file
if [ -f "../.env" ]; then
  export $(grep -v '^#' ../.env | xargs)
else
  echo "Error: .env file not found in the project root directory."
  exit 1
fi

# Check required environment variables
required_vars=(
  "AWS_REGION"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_ACCOUNT_ID"
  "NODE_ENV"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set in .env file"
    exit 1
  fi
done

# Set default values if not provided
ENVIRONMENT=${NODE_ENV:-development}
SECRETS_PREFIX="/ledgerly/"
KMS_KEY_ALIAS="alias/ledgerly-secrets-key"
POLICY_NAME="LedgerlySecretsManagerPolicy"
ROLE_NAME="LedgerlySecretsManagerRole"

# Function to print section headers
print_section() {
  echo -e "\n\033[1;34m$1\033[0m"
  echo "$(printf '=%.0s' {1..80})"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if AWS CLI is installed
if ! command_exists aws; then
  echo "Error: AWS CLI is not installed. Please install it first."
  exit 1
fi

# Configure AWS CLI
print_section "Configuring AWS CLI"
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_REGION"
aws configure set output "json"

echo "AWS CLI configured successfully."

# Create KMS Key for Secrets Manager
print_section "Creating KMS Key for Secrets Manager"
KMS_KEY_ID=$(aws kms describe-key --key-id "$KMS_KEY_ALIAS" --query 'KeyMetadata.KeyId' --output text 2>/dev/null || true)

if [ -z "$KMS_KEY_ID" ]; then
  echo "Creating KMS key..."
  KMS_KEY_ID=$(aws kms create-key --description "Ledgerly Secrets Manager Key" --tags TagKey=Name,TagValue=LedgerlySecretsKey --query 'KeyMetadata.KeyId' --output text)
  echo "KMS Key created with ID: $KMS_KEY_ID"
  
  # Create alias for the KMS key
  aws kms create-alias \
    --alias-name "$KMS_KEY_ALIAS" \
    --target-key-id "$KMS_KEY_ID"
  echo "Created KMS key alias: $KMS_KEY_ALIAS"
else
  echo "KMS key already exists with ID: $KMS_KEY_ID"
fi

# Create IAM Policy for Secrets Manager
print_section "Creating IAM Policy for Secrets Manager"
POLICY_ARN=$(aws iam list-policies --scope Local --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text 2>/dev/null || true)

if [ -z "$POLICY_ARN" ]; then
  echo "Creating IAM policy..."
  POLICY_DOCUMENT=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${ENVIRONMENT}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:kms:${AWS_REGION}:${AWS_ACCOUNT_ID}:key/${KMS_KEY_ID}"
      ]
    }
  ]
}
EOF
  )
  
  POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --description "Policy for Ledgerly to access Secrets Manager" \
    --policy-document "$POLICY_DOCUMENT" \
    --query 'Policy.Arn' \
    --output text)
  echo "Created IAM policy with ARN: $POLICY_ARN"
else
  echo "IAM policy already exists with ARN: $POLICY_ARN"
fi

# Create IAM Role for the application
print_section "Creating IAM Role for the Application"
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || true)

if [ -z "$ROLE_ARN" ]; then
  echo "Creating IAM role..."
  ASSUME_ROLE_POLICY_DOCUMENT='{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'
  
  ROLE_ARN=$(aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$ASSUME_ROLE_POLICY_DOCUMENT" \
    --description "Role for Ledgerly application to access AWS services" \
    --query 'Role.Arn' \
    --output text)
  echo "Created IAM role with ARN: $ROLE_ARN"
  
  # Attach the policy to the role
  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$POLICY_ARN"
  echo "Attached policy $POLICY_NAME to role $ROLE_NAME"
else
  echo "IAM role already exists with ARN: $ROLE_ARN"
fi

# Create sample secrets if they don't exist
print_section "Creating Sample Secrets"

# Database credentials
SECRET_NAME="${ENVIRONMENT}/database/credentials"
SECRET_EXISTS=$(aws secretsmanager list-secrets --query "SecretList[?Name=='$SECRET_NAME'].Name" --output text 2>/dev/null || true)

if [ -z "$SECRET_EXISTS" ]; then
  echo "Creating sample database credentials..."
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "Database credentials for Ledgerly ${ENVIRONMENT} environment" \
    --secret-string '{"DB_HOST":"localhost","DB_PORT":"5432","DB_USER":"postgres","DB_PASSWORD":"postgres","DB_NAME":"ledgerly_'${ENVIRONMENT}'","DATABASE_URL":"postgresql://postgres:postgres@localhost:5432/ledgerly_'${ENVIRONMENT}'"}'
  echo "Created secret: $SECRET_NAME"
else
  echo "Secret already exists: $SECRET_NAME"
fi

# JWT configuration
SECRET_NAME="${ENVIRONMENT}/auth/jwt"
SECRET_EXISTS=$(aws secretsmanager list-secrets --query "SecretList[?Name=='$SECRET_NAME'].Name" --output text 2>/dev/null || true)

if [ -z "$SECRET_EXISTS" ]; then
  echo "Creating sample JWT configuration..."
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "JWT configuration for Ledgerly ${ENVIRONMENT} environment" \
    --secret-string '{"JWT_SECRET":"replace-with-a-secure-random-string","JWT_EXPIRES_IN":"1d","JWT_ISSUER":"ledgerly","JWT_AUDIENCE":"ledgerly-client"}'
  echo "Created secret: $SECRET_NAME"
else
  echo "Secret already exists: $SECRET_NAME"
fi

# Plaid configuration
SECRET_NAME="${ENVIRONMENT}/integrations/plaid"
SECRET_EXISTS=$(aws secretsmanager list-secrets --query "SecretList[?Name=='$SECRET_NAME'].Name" --output text 2>/dev/null || true)

if [ -z "$SECRET_EXISTS" ]; then
  echo "Creating sample Plaid configuration..."
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "Plaid configuration for Ledgerly ${ENVIRONMENT} environment" \
    --secret-string '{"PLAID_CLIENT_ID":"your-plaid-client-id","PLAID_SECRET":"your-plaid-secret","PLAID_ENV":"sandbox","PLAID_WEBHOOK_URL":""}'
  echo "Created secret: $SECRET_NAME"
else
  echo "Secret already exists: $SECRET_NAME"
fi

# Print summary
print_section "Setup Summary"
echo "✅ AWS Secrets Manager setup complete!"
echo ""
echo "🔑 KMS Key ID: $KMS_KEY_ID"
echo "📜 IAM Policy ARN: $POLICY_ARN"
echo "👤 IAM Role ARN: $ROLE_ARN"
echo ""
echo "Sample secrets have been created in AWS Secrets Manager with the following names:"
echo "- ${ENVIRONMENT}/database/credentials"
echo "- ${ENVIRONMENT}/auth/jwt"
echo "- ${ENVIRONMENT}/integrations/plaid"
echo ""
echo "Next steps:"
echo "1. Update the sample secrets with your actual values using the AWS Console or CLI"
echo "2. Configure your application to use the IAM role or provide AWS credentials"
echo "3. Test the integration using the test script: npx ts-node scripts/test-aws-secrets.ts"

exit 0
