#!/bin/bash

# Exit on error
set -e

# Set environment variables for testing
export NODE_ENV=test

# Default test type (unit tests)
TEST_TYPE=${1:-unit}

# Function to run unit tests
run_unit_tests() {
  echo "Running unit tests..."
  npx jest --config=jest.config.ts --testPathPattern="tests/unit" --coverage
}

# Function to run integration tests
run_integration_tests() {
  echo "Running integration tests..."
  
  # Check if AWS credentials are configured
  if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "Error: AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
    exit 1
  fi
  
  # Run integration tests with increased timeout
  npx jest --config=jest.config.ts --testPathPattern="tests/integration" --testTimeout=60000
}

# Function to run all tests
run_all_tests() {
  echo "Running all tests..."
  
  # Run unit tests first
  run_unit_tests
  
  # Then run integration tests if AWS credentials are available
  if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo ""
    run_integration_tests
  else
    echo "Skipping integration tests: AWS credentials not found"
  fi
}

# Main script
case "$TEST_TYPE" in
  unit)
    run_unit_tests
    ;;
  integration)
    run_integration_tests
    ;;
  all)
    run_all_tests
    ;;
  *)
    echo "Usage: $0 [unit|integration|all]"
    echo "  unit: Run unit tests (default)"
    echo "  integration: Run integration tests"
    echo "  all: Run all tests"
    exit 1
    ;;
esac

echo "Tests completed successfully!"
