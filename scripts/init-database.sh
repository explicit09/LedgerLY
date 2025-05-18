#!/bin/bash

# Script to initialize the database for LedgerLY

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Initializing LedgerLY database..."

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
    exit 1
fi

# Database configuration
DB_NAME="ledgerly_db"
DB_USER="ledgerly_app"
DB_PASSWORD="ledgerly_password"

# Create database user
echo "Creating database user..."
psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" postgres

# Create database
echo "Creating database..."
psql -c "CREATE DATABASE $DB_NAME WITH OWNER $DB_USER;" postgres

# Grant privileges
echo "Granting privileges..."
psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" postgres

echo -e "${GREEN}Database initialization completed!${NC}"
echo "Please update your .env file with the following DATABASE_URL:"
echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public\""

# Instructions for the next steps
echo -e "\nNext steps:"
echo "1. Copy the DATABASE_URL above to your .env file"
echo "2. Run 'npx prisma migrate dev' to create the database schema"
echo "3. Run 'npx prisma generate' to generate the Prisma Client" 