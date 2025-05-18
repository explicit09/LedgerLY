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

# Function to print section headers
print_section() {
  echo -e "\n\033[1;34m$1\033[0m"
  echo "$(printf '=%.0s' {1..80})"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if Node.js and npm are installed
if ! command_exists node || ! command_exists npm; then
  echo "Error: Node.js and npm are required to run the tests."
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "../node_modules" ]; then
  echo "Installing dependencies..."
  (cd .. && npm install)
fi

# Check if AWS CLI is installed
if ! command_exists aws; then
  echo "Error: AWS CLI is required to run the tests."
  exit 1
fi

# Configure AWS CLI
echo "Configuring AWS CLI..."
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_REGION"
aws configure set output "json"

# Test AWS credentials
echo -n "Testing AWS credentials... "
if aws sts get-caller-identity > /dev/null 2>&1; then
  echo "✅ Success"
else
  echo "❌ Failed"
  echo "Error: Invalid AWS credentials. Please check your .env file and try again."
  exit 1
fi

# Test Secrets Manager access
echo -n "Testing Secrets Manager access... "
if aws secretsmanager list-secrets --max-items 1 > /dev/null 2>&1; then
  echo "✅ Success"
else
  echo "❌ Failed"
  echo "Error: Unable to access AWS Secrets Manager. Please check your IAM permissions."
  exit 1
fi

# List available secrets for the current environment
echo -e "\nAvailable secrets for environment: $ENVIRONMENT"
echo "----------------------------------------"
aws secretsmanager list-secrets --query "SecretList[?starts_with(Name, '$ENVIRONMENT/')].Name" --output table

# Run the TypeScript test script
echo -e "\nRunning integration tests..."
(cd .. && npx ts-node scripts/test-aws-secrets.ts)

# Check the exit status of the test script
if [ $? -eq 0 ]; then
  echo -e "\n✅ All tests passed successfully!"
  exit 0
else
  echo -e "\n❌ Some tests failed. Please check the output above for details."
  exit 1
fi
