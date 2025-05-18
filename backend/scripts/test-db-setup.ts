import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

async function setupTestDatabase() {
  try {
    console.log('Setting up test database...');
    
    // Apply all migrations
    await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS public;`;
    
    // Drop all tables in the public schema
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `;
    
    // Disable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = 'replica'`;
    
    // Drop all tables
    for (const { tablename } of tables) {
      if (tablename !== '_prisma_migrations') {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tablename}" CASCADE;`);
      }
    }
    
    // Re-enable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = 'origin'`;
    
    // Run migrations
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" varchar(36) PRIMARY KEY,
        "checksum" varchar(64) NOT NULL,
        "finished_at" timestamptz,
        "migration_name" varchar(255) NOT NULL,
        "logs" text,
        "rolled_back_at" timestamptz,
        "started_at" timestamptz NOT NULL DEFAULT now(),
        "applied_steps_count" integer NOT NULL DEFAULT 0
      );
    `;
    
    // Apply all migrations
    const { execSync } = require('child_process');
    console.log('Running migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupTestDatabase();
