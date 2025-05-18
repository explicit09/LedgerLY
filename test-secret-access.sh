#!/bin/bash

# Exit on error
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  # Source the file to ensure all variables are available
  set -a
  source .env
  set +a
  echo "Loaded environment variables from .env file"
else
  echo "Error: .env file not found in the project root"
  exit 1
fi

echo "Testing secret access..."

# Test database secret
SECRET_NAME="development/database/credentials"
DB_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text 2>/dev/null || echo "Failed to access secret")

if [ "$DB_SECRET" = "Failed to access secret" ]; then
  echo "❌ Failed to access database secret"
  echo "   Make sure your AWS credentials have the necessary permissions"
  echo "   Tried to access secret: $SECRET_NAME"
  echo "   AWS Region: $AWS_REGION"
  exit 1
fi

echo "✅ Successfully accessed all secrets"

echo -e "\nTo test in your application, use the following code:"
cat << 'EOF'
import { awsSecretsService } from './services/secrets';

async function testSecrets() {
  try {
    // Get database config
    const dbConfig = await awsSecretsService.getSecret('development/database/credentials');
    console.log('Database Config:', dbConfig);
    
    // Get JWT config
    const jwtConfig = await awsSecretsService.getSecret('development/auth/jwt');
    console.log('JWT Config:', jwtConfig);
    
    // Get Plaid config
    const plaidConfig = await awsSecretsService.getSecret('development/integrations/plaid');
    console.log('Plaid Config:', plaidConfig);
  } catch (error) {
    console.error('Error accessing secrets:', error);
  }
}

testSecrets();
EOF
