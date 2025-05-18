#!/bin/bash

# Script to migrate to the new Plaid service implementation

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Plaid service migration...${NC}"

# Backup existing files
echo -e "${YELLOW}📦 Backing up existing files...${NC}"

# Create backup directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./plaid_backup_${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

# Backup existing files
cp src/services/plaid/plaid.service.ts "${BACKUP_DIR}/" 2>/dev/null || true
cp src/controllers/plaid.controller.ts "${BACKUP_DIR}/" 2>/dev/null || true
cp src/routes/plaid.routes.ts "${BACKUP_DIR}/" 2>/dev/null || true

# Move new files into place
echo -e "\n${YELLOW}🔄 Moving new files into place...${NC}"

# Services
mv src/services/plaid/plaid.service.new.ts src/services/plaid/plaid.service.ts

# Controllers
mv src/controllers/plaid.controller.new.ts src/controllers/plaid.controller.ts

# Routes
mv src/routes/plaid.routes.new.ts src/routes/plaid.routes.ts

# Update imports in other files
echo -e "\n${YELLOW}🔄 Updating imports...${NC}"

# Update imports in app.ts or index.ts
if [ -f "src/app.ts" ]; then
  sed -i '' 's/..\/controllers\/plaid.controller/..\/controllers\/plaid.controller.new/g' src/app.ts 2>/dev/null || true
fi

# Install dependencies if needed
echo -e "\n${YELLOW}📦 Checking dependencies...${NC}"
npm list plaid || npm install plaid
npm list @prisma/client || npm install @prisma/client

# Run Prisma migration
echo -e "\n${YELLOW}🚀 Running Prisma migration...${NC}"
npx prisma migrate dev --name update_plaid_schema

# Build the project
echo -e "\n${YELLOW}🏗️  Building the project...${NC}"
npm run build

echo -e "\n${GREEN}✅ Migration completed successfully!${NC}"
echo -e "${YELLOW}📝 A backup of your previous files can be found in: ${BACKUP_DIR}${NC}"
echo -e "\n${GREEN}🚀 You can now start using the enhanced Plaid service!${NC}"
