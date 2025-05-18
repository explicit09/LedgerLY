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

# Required variables
REQUIRED_VARS=(
  "AWS_REGION"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_ACCOUNT_ID"
  "ENVIRONMENT"
)

# Check if required variables are set
MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    MISSING_VARS=1
  fi
done

if [ $MISSING_VARS -ne 0 ]; then
  echo "Please ensure the following environment variables are set in your .env file:"
  printf '%s\n' "${REQUIRED_VARS[@]}"
  exit 1
fi

echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo ""

# Policy file
POLICY_FILE="infrastructure/iam/user-policy.json"
TEMP_POLICY="/tmp/user-policy-$(date +%s).json"

# Replace variables in the policy template
sed -e "s/\${AWS_REGION}/${AWS_REGION}/g" \
    -e "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" \
    -e "s/\${ENVIRONMENT}/${ENVIRONMENT}/g" \
    "${POLICY_FILE}" > "${TEMP_POLICY}"

# Policy name
POLICY_NAME="LedgerlyUserSecretsPolicy-${ENVIRONMENT}"

# Check if policy already exists
EXISTING_POLICY=$(aws iam list-policies --query "Policies[?PolicyName=='${POLICY_NAME}'].Arn" --output text)

if [ -z "$EXISTING_POLICY" ]; then
  echo "Creating IAM policy: ${POLICY_NAME}"
  POLICY_ARN=$(aws iam create-policy \
    --policy-name "${POLICY_NAME}" \
    --description "Policy for Ledgerly user to access secrets" \
    --policy-document "file://${TEMP_POLICY}" \
    --query 'Policy.Arn' \
    --output text)
  
  echo "Policy created successfully: ${POLICY_ARN}"
else
  echo "Policy already exists: ${EXISTING_POLICY}"
  
  # Update the existing policy
  echo "Updating existing policy..."
  aws iam create-policy-version \
    --policy-arn "${EXISTING_POLICY}" \
    --policy-document "file://${TEMP_POLICY}" \
    --set-as-default
  
  POLICY_ARN="${EXISTING_POLICY}"
  echo "Policy updated successfully"
fi

# Get current IAM user
CURRENT_USER_ARN=$(aws sts get-caller-identity --query 'Arn' --output text)
CURRENT_USER_NAME=$(echo $CURRENT_USER_ARN | awk -F'/' '{print $NF}')

# Attach policy to user
echo "Attaching policy to IAM user: ${CURRENT_USER_NAME}"
aws iam attach-user-policy \
  --user-name "${CURRENT_USER_NAME}" \
  --policy-arn "${POLICY_ARN}"

echo "Policy attached successfully to user: ${CURRENT_USER_NAME}"

# Clean up
rm -f "${TEMP_POLICY}"

echo "User policy setup completed successfully"
