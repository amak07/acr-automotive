/**
 * Start test database (manual command)
 * Usage: npm run db:test:start
 */

import dotenv from 'dotenv';
import path from 'path';
import { testDb } from './db-lifecycle';

// Load local test environment
dotenv.config({ path: path.join(process.cwd(), '.env.test.local') });

async function main() {
  try {
    await testDb.startContainer();
    await testDb.runMigrations();
    await testDb.seedDatabase();
    await testDb.close();
    console.log('\n✅ Test database ready at localhost:5433');
    console.log('   Connection: postgresql://postgres:postgres@localhost:5433/acr_test\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
