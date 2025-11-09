/**
 * Stop test database (manual command)
 * Usage: npm run db:test:stop
 */

import { testDb } from './db-lifecycle';

async function main() {
  try {
    await testDb.stopContainer();
    console.log('\n✅ Test database stopped');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
