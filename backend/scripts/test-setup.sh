#!/bin/bash
set -e

# Load environment variables from .env.test
export $(grep -v '^#' .env.test | xargs)

# Function to start the test database
start_test_database() {
  echo "Starting test database..."
  docker-compose -f docker-compose.test.yml up -d
  
  # Wait for the database to be ready
  echo "Waiting for database to be ready..."
  local max_attempts=30
  local attempt=1
  
  until docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U postgres > /dev/null; do
    if [ $attempt -ge $max_attempts ]; then
      echo "Failed to start database after $max_attempts attempts"
      exit 1
    fi
    
    echo "Waiting for database to be ready (attempt $attempt/$max_attempts)..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo "Database is ready!"
}

# Function to setup the test database
setup_test_database() {
  echo "Setting up test database..."
  
  # Create the test database if it doesn't exist
  if ! docker-compose -f docker-compose.test.yml exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw ledgerly_test; then
    echo "Creating test database..."
    docker-compose -f docker-compose.test.yml exec -T postgres psql -U postgres -c "CREATE DATABASE ledgerly_test;"
  fi
  
  # Run migrations
  echo "Running migrations..."
  if ! DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ledgerly_test?schema=public" npx prisma migrate deploy; then
    echo "Failed to run migrations"
    exit 1
  fi
}

# Check if we're running in CI environment
if [ "$CI" = "true" ]; then
  echo "Running in CI environment"
  start_test_database
  setup_test_database
else
  # In local development, only start if not already running
  if ! docker-compose -f docker-compose.test.yml ps -q postgres > /dev/null 2>&1; then
    start_test_database
  fi
  
  # Always setup the database to ensure it's in a clean state
  setup_test_database
fi

# Run tests with the test environment variables
echo "Running tests..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ledgerly_test?schema=public" \
NODE_ENV=test \
npx jest --detectOpenHandles --forceExit "$@"

# Only stop the database in CI environment
if [ "$CI" = "true" ]; then
  echo "Tests completed, stopping test database..."
  docker-compose -f docker-compose.test.yml down -v
fi
