import { setupTestDatabase } from './test-utils';

// This runs before each test file
export default async function() {
  await setupTestDatabase();
};
