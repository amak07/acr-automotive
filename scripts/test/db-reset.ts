/**
 * Reset test database (manual command)
 * Usage: npm run db:test:reset
 */

import dotenv from 'dotenv';
import path from 'path';
import { testDb } from './db-lifecycle';

// Load local test environment
dotenv.config({ path: path.join(process.cwd(), '.env.test.local') });

async function main() {
  try {
    await testDb.startContainer();
    await testDb.resetDatabase();
    await testDb.runMigrations();
    await testDb.seedDatabase();
    await testDb.close();
    console.log('\n✅ Test database reset complete');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
