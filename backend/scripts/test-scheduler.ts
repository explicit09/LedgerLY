import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the scheduler
import { transactionSyncScheduler } from '../src/services/scheduler';
import { logger } from '../src/utils/logger';

// Test the transaction sync scheduler
async function testScheduler() {
  try {
    logger.info('Starting transaction sync scheduler test...');
    
    // Start the scheduler with a short interval for testing (every 30 seconds)
    transactionSyncScheduler.start('*/30 * * * * *');
    
    logger.info('Transaction sync scheduler started. Press Ctrl+C to stop.');
    
    // Keep the process running
    await new Promise(() => {});
  } catch (error) {
    logger.error('Error in scheduler test:', error);
    process.exit(1);
  }
}

// Run the test
testScheduler().catch(error => {
  logger.error('Unhandled error in test:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Stopping transaction sync scheduler test...');
  transactionSyncScheduler.stop();
  process.exit(0);
});
