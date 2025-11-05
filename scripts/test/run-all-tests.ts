/**
 * Master Test Script - Run Complete Test Suite
 *
 * Orchestrates the full testing workflow:
 * 1. Reset database to clean baseline (877 parts)
 * 2. Run unit tests (no database operations)
 * 3. Run integration tests (with cleanup hooks)
 * 4. Run full pipeline test (import + rollback)
 * 5. Reset database back to baseline
 * 6. Verify final state
 *
 * Usage:
 *   npm run test:all
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: path.join(process.cwd(), '.env.test') });

const TEST_PROJECT_ID = 'fzsdaqpwwbuwkvbzyiax'; // acr-automotive-test

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

function runCommand(command: string, description: string): boolean {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`▶️  ${description}`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'test' }
    });

    const duration = Date.now() - startTime;
    results.push({ name: description, passed: true, duration });
    console.log(`\n✅ ${description} - PASSED (${duration}ms)\n`);
    return true;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    results.push({
      name: description,
      passed: false,
      duration,
      error: error.message
    });
    console.error(`\n❌ ${description} - FAILED (${duration}ms)\n`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('🧪 MASTER TEST SUITE - ACR Automotive');
  console.log('═'.repeat(80));
  console.log(`Test Environment: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`Expected Project: ${TEST_PROJECT_ID}`);
  console.log('═'.repeat(80));

  // Verify we're using the test environment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(TEST_PROJECT_ID)) {
    console.error('\n❌ SAFETY CHECK FAILED!');
    console.error(`   Not using TEST Supabase project (${TEST_PROJECT_ID})`);
    console.error(`   Current URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.error('\n   Aborting to prevent production data loss!\n');
    process.exit(1);
  }

  console.log('✅ Safety check passed - using TEST environment\n');

  const overallStartTime = Date.now();

  // Step 1: Reset database to clean baseline
  const resetSuccess = runCommand(
    'npm run test:reset-db',
    'Step 1: Reset Database to Baseline (877 parts)'
  );

  if (!resetSuccess) {
    console.error('\n💥 Database reset failed - aborting test suite\n');
    printSummary(Date.now() - overallStartTime);
    process.exit(1);
  }

  // Step 2: Run unit tests (no database operations)
  const unitSuccess = runCommand(
    'npx jest tests/unit --no-coverage',
    'Step 2: Unit Tests (61 tests)'
  );

  // Step 3: Run integration tests (with cleanup hooks)
  const integrationSuccess = runCommand(
    'npx jest tests/integration --no-coverage',
    'Step 3: Integration Tests (22 tests)'
  );

  // Step 4: Run full pipeline test (import + rollback)
  const pipelineSuccess = runCommand(
    'npm run test:full-pipeline',
    'Step 4: Full Pipeline Test (import + rollback)'
  );

  // Step 5: Reset database back to baseline (cleanup after pipeline test)
  const finalResetSuccess = runCommand(
    'npm run test:reset-db',
    'Step 5: Final Reset to Baseline'
  );

  // Step 6: Verify final state
  const verifySuccess = runCommand(
    'npx tsx scripts/verify-baseline.ts',
    'Step 6: Verify Database State'
  );

  // Print summary
  const overallDuration = Date.now() - overallStartTime;
  printSummary(overallDuration);

  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

function printSummary(totalDuration: number) {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('📊 TEST SUITE SUMMARY');
  console.log('═'.repeat(80));
  console.log('');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const duration = `${result.duration}ms`;
    console.log(`${status} - ${result.name} (${duration})`);
    if (result.error) {
      console.log(`       Error: ${result.error}`);
    }
  });

  console.log('');
  console.log('─'.repeat(80));
  console.log(`Total: ${results.length} steps`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
  console.log('─'.repeat(80));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
    console.log('✅ Unit Tests: 61 passed');
    console.log('✅ Integration Tests: 22 passed');
    console.log('✅ Full Pipeline: Import + Rollback working');
    console.log('✅ Database State: Clean 877-part baseline verified');
    console.log('');
  } else {
    console.log('\n💥 SOME TESTS FAILED\n');
    console.log(`❌ ${failed} step(s) failed`);
    console.log('   Review the output above for details');
    console.log('');
  }
}

// Run the master test suite
runAllTests().catch(error => {
  console.error('\n💥 Unexpected error in test suite:');
  console.error(error);
  process.exit(1);
});
