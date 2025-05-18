#!/bin/bash

# Script to set up the database and run migrations

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting database setup...${NC}"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}❌ PostgreSQL client (psql) is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw mydb; then
    echo -e "${YELLOW}ℹ️  Database 'mydb' already exists. Dropping it...${NC}"
    dropdb mydb
fi

# Create database
echo -e "${YELLOW}🔄 Creating database...${NC}"
createdb mydb

# Run Prisma migration
echo -e "\n${YELLOW}🚀 Running Prisma migration...${NC}"
cd backend
npx prisma migrate dev --name init

# Generate Prisma client
echo -e "\n${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Return to project root
cd ..

echo -e "\n${GREEN}✅ Database setup completed successfully!${NC}"
