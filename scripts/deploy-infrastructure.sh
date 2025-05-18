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
  "NODE_ENV"
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

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
for cmd in aws jq; do
  if ! command_exists "$cmd"; then
    echo "Error: $cmd is not installed"
    exit 1
  fi
done

# Function to confirm before proceeding
confirm() {
  read -r -p "$1 [y/N] " response
  case "$response" in
    [yY][eE][sS]|[yY]) 
      true
      ;;
    *)
      false
      ;;
  esac
}

echo "=== LedgerLY Infrastructure Deployment ==="
echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo ""

# Confirm deployment
if ! confirm "Do you want to proceed with the deployment?"; then
  echo "Deployment cancelled"
  exit 0
fi

# Deploy IAM policies
echo -e "\n=== Deploying IAM Policies ==="
./scripts/setup-iam-policy.sh

# Setup secrets
echo -e "\n=== Setting up Secrets ==="
./scripts/setup-secrets.sh

# Output completion message
echo -e "\n=== Deployment Complete ==="
echo "The following resources have been deployed:"
echo "- IAM Policies for analytics service"
echo "- Environment-specific secrets in AWS Secrets Manager"
echo ""
echo "Next steps:"
echo "1. Update your deployment pipeline to use the new secrets"
echo "2. Configure your application to use the AWS Secrets Manager"
echo "3. Monitor CloudWatch logs for any access issues"

# Optional: Create a test script to verify the setup
cat > test-secret-access.sh << 'EOL'
#!/bin/bash
# Test script to verify secret access
echo "Testing secret access..."

# Test database secret
DB_SECRET=$(aws secretsmanager get-secret-value --secret-id "$ENVIRONMENT/database/credentials" --region "$AWS_REGION" --query SecretString --output text 2>/dev/null || echo "Failed to access secret")
if [ "$DB_SECRET" = "Failed to access secret" ]; then
  echo "❌ Failed to access database secret"
  echo "   Make sure your AWS credentials have the necessary permissions"
else
  echo "✅ Successfully accessed database secret"
  echo "   Host: $(echo $DB_SECRET | jq -r '.DB_HOST')"
fi

echo -e "\nTo test in your application, use the following code:"
cat << 'EOF'
import { awsSecretsService } from './services/secrets';

async function testSecrets() {
  try {
    // Get database config
    const dbConfig = await awsSecretsService.getSecret('database/credentials');
    console.log('Database Config:', dbConfig);
    
    // Get JWT config
    const jwtConfig = await awsSecretsService.getSecret('auth/jwt');
    console.log('JWT Config:', jwtConfig);
    
    // Get Plaid config
    const plaidConfig = await awsSecretsService.getSecret('integrations/plaid');
    console.log('Plaid Config:', plaidConfig);
  } catch (error) {
    console.error('Error accessing secrets:', error);
  }
}

testSecrets();
EOF
EOL

chmod +x test-secret-access.sh

echo -e "\nA test script has been created: test-secret-access.sh"
echo "Run it to verify secret access from your environment."
