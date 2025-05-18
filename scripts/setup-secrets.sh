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
  "ENVIRONMENT"
  "NODE_ENV"
  "DATABASE_URL"
  "JWT_SECRET"
  "PLAID_CLIENT_ID"
  "PLAID_SECRET"
  "PLAID_ENV"
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
echo ""

# Function to create or update a secret
create_or_update_secret() {
  local secret_name=$1
  local secret_string=$2
  
  echo "Processing secret: $secret_name"
  
  # Check if secret exists
  if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" > /dev/null 2>&1; then
    echo "Updating existing secret: $secret_name"
    aws secretsmanager update-secret \
      --secret-id "$secret_name" \
      --secret-string "$secret_string" \
      --region "$AWS_REGION"
  else
    echo "Creating new secret: $secret_name"
    aws secretsmanager create-secret \
      --name "$secret_name" \
      --description "LedgerLY $ENVIRONMENT $secret_name" \
      --secret-string "$secret_string" \
      --region "$AWS_REGION"
  fi
}

# Database credentials (extract from DATABASE_URL if needed)
DB_SECRETS=$(cat <<EOF
{
  "DATABASE_URL": "$DATABASE_URL",
  "DB_HOST": "$(echo $DATABASE_URL | awk -F'[@:]' '{print $4}' | cut -d'/' -f1)",
  "DB_PORT": "$(echo $DATABASE_URL | awk -F'[@:]' '{print $5}' | cut -d'/' -f1)",
  "DB_NAME": "$(echo $DATABASE_URL | awk -F'/' '{print $NF}' | cut -d'?' -f1)",
  "DB_USER": "$(echo $DATABASE_URL | awk -F'[:/@]' '{print $4}')",
  "DB_PASSWORD": "$(echo $DATABASE_URL | awk -F'[:/@]' '{print $5}')"
}
EOF
)

# JWT Secret
JWT_SECRETS=$(cat <<EOF
{
  "JWT_SECRET": "$JWT_SECRET",
  "JWT_EXPIRES_IN": "7d"
}
EOF
)

# Plaid API credentials
PLAID_SECRETS=$(cat <<EOF
{
  "PLAID_CLIENT_ID": "$PLAID_CLIENT_ID",
  "PLAID_SECRET": "$PLAID_SECRET",
  "PLAID_ENV": "$PLAID_ENV"
}
EOF
)

# Create/Update secrets
create_or_update_secret "$ENVIRONMENT/database/credentials" "$DB_SECRETS"
create_or_update_secret "$ENVIRONMENT/auth/jwt" "$JWT_SECRETS"
create_or_update_secret "$ENVIRONMENT/integrations/plaid" "$PLAID_SECRETS"

echo "All secrets have been successfully configured in AWS Secrets Manager"
