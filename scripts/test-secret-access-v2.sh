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

echo "=== Testing AWS Configuration ==="

# Test AWS credentials
echo "Testing AWS credentials..."
aws sts get-caller-identity

# List available secrets
echo -e "\nListing available secrets..."
aws secretsmanager list-secrets --region $AWS_REGION --max-items 10

# Test accessing each secret
SECRETS=(
  "development/database/credentials"
  "development/auth/jwt"
  "development/integrations/plaid"
)

echo -e "\n=== Testing Secret Access ==="

for secret in "${SECRETS[@]}"; do
  echo -e "\nTesting access to secret: $secret"
  
  # Check if secret exists
  if aws secretsmanager describe-secret --secret-id "$secret" --region "$AWS_REGION" > /dev/null 2>&1; then
    echo "✅ Secret exists"
    
    # Try to get the secret value
    if aws secretsmanager get-secret-value --secret-id "$secret" --region "$AWS_REGION" > /dev/null 2>&1; then
      echo "✅ Successfully accessed secret value"
      
      # Get and display a preview of the secret value (redacted)
      echo "Secret value (redacted):"
      aws secretsmanager get-secret-value --secret-id "$secret" --region "$AWS_REGION" \
        | jq '.SecretString | fromjson | with_entries(if .key | test("(password|secret|key|token|credential)", "i") then .value = "***REDACTED***" else . end)'
    else
      echo "❌ Failed to access secret value"
      echo "   Error: $(aws secretsmanager get-secret-value --secret-id "$secret" --region "$AWS_REGION" 2>&1 | jq -r .message)"
    fi
  else
    echo "❌ Secret does not exist"
  fi
done

echo -e "\n=== Testing Complete ==="
echo -e "\nIf you see any errors above, please check the following:"
echo "1. Your AWS credentials have the necessary permissions"
echo "2. The secrets exist in the specified region"
echo "3. The secret names match exactly"
echo "4. Your IAM user has the 'secretsmanager:GetSecretValue' permission"
