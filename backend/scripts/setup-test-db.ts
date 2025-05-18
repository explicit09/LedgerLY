import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

const prisma = new PrismaClient();

async function setupTestDatabase() {
  try {
    console.log('Setting up test database...');
    
    // Get database name from DATABASE_URL
    const databaseUrl = new URL(process.env.DATABASE_URL!);
    const dbName = databaseUrl.pathname.replace(/^\//, '');
    
    // Connect to the postgres database to drop/create the test database
    const postgresUrl = new URL(process.env.DATABASE_URL!);
    postgresUrl.pathname = '/postgres';
    
    const postgresPrisma = new PrismaClient({
      datasourceUrl: postgresUrl.toString(),
    });
    
    try {
      // Drop and recreate the test database
      console.log(`Dropping and recreating database: ${dbName}`);
      await postgresPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS \"${dbName}\"`);
      await postgresPrisma.$executeRawUnsafe(`CREATE DATABASE \"${dbName}\"`);
      console.log('Test database recreated successfully');
    } catch (error) {
      console.error('Error recreating test database:', error);
      throw error;
    } finally {
      await postgresPrisma.$disconnect();
    }
    
    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupTestDatabase().catch((error) => {
    console.error('Fatal error during test database setup:', error);
    process.exit(1);
  });
}

export { setupTestDatabase };
