import { cleanDatabase } from './test-utils';

export default async function() {
  try {
    // Clean up all test data
    await cleanDatabase();
  } catch (error) {
    console.error('Error during teardown:', error);
    process.exit(1);
  }
};
