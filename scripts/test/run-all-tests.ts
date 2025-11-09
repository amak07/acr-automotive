/**
 * Master Test Runner - npm test
 * Orchestrates all testing with automatic database lifecycle management
 */

import { testDb } from './db-lifecycle';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import path from 'path';

const execAsync = promisify(exec);

// Load test environment
dotenv.config({ path: path.join(process.cwd(), '.env.test.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.test') });

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  output?: string;
}

async function runCommand(
  command: string,
  name: string
): Promise<TestResult> {
  const start = Date.now();

  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for test output
    });
    const duration = Date.now() - start;

    return {
      name,
      passed: true,
      duration,
      output: stdout
    };
  } catch (error: any) {
    const duration = Date.now() - start;

    return {
      name,
      passed: false,
      duration,
      output: error.stdout || error.message
    };
  }
}

async function main() {
  console.log('🧪 ACR AUTOMOTIVE TEST SUITE');
  console.log('━'.repeat(60));
  console.log('');

  const results: TestResult[] = [];
  let totalStart = Date.now();

  try {
    // Setup database
    console.log('📋 Preparing test environment...');
    await testDb.startContainer();
    await testDb.resetDatabase();
    await testDb.runMigrations();
    await testDb.seedDatabase();
    console.log('');

    // TypeScript validation
    console.log('📝 TypeScript Validation...');
    results.push(await runCommand('npm run type-check', 'Type Check'));
    console.log('');

    // Unit tests
    console.log('🧩 Unit Tests...');
    results.push(await runCommand('jest', 'Jest Unit Tests'));
    console.log('');

    // Integration tests (Direct Supabase client - works with local Docker DB)
    // Note: API route tests (test-api-*.ts) are excluded - they require dev server
    console.log('🔗 Integration Tests...');
    results.push(await runCommand(
      'cross-env NODE_ENV=test tsx scripts/test/test-all-fixtures.ts',
      'Fixture Validation'
    ));
    results.push(await runCommand(
      'cross-env NODE_ENV=test tsx scripts/test/test-full-import-pipeline.ts',
      'Import Pipeline'
    ));
    results.push(await runCommand(
      'tsx scripts/test/test-atomic-constraint-violation.ts',
      'Atomic Constraint Test'
    ));
    results.push(await runCommand(
      'tsx scripts/test/test-atomic-fk-violation.ts',
      'Atomic FK Test'
    ));
    console.log('');

    // Generate report
    const totalDuration = Date.now() - totalStart;
    generateReport(results, totalDuration);

    // Exit with appropriate code
    const allPassed = results.every(r => r.passed);
    process.exit(allPassed ? 0 : 1);

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await testDb.close();
  }
}

function generateReport(results: TestResult[], totalDuration: number) {
  console.log('━'.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('');

  // Service-level summary
  const importPipelinePassed = results.find(r => r.name === 'Import Pipeline')?.passed ?? false;
  const fixtureValidationPassed = results.find(r => r.name === 'Fixture Validation')?.passed ?? false;
  const atomicPassed = results.filter(r => r.name.includes('Atomic')).every(r => r.passed);
  const unitTestsPassed = results.find(r => r.name === 'Jest Unit Tests')?.passed ?? false;

  console.log('Import Service:        ' + (importPipelinePassed ? '✅ PASS' : '❌ FAIL'));
  console.log('Export Service:        ' + (unitTestsPassed ? '✅ PASS' : '❌ FAIL') + ' (covered in unit tests)');
  console.log('Validation Engine:     ' + (fixtureValidationPassed ? '✅ PASS' : '❌ FAIL'));
  console.log('Atomic Transactions:   ' + (atomicPassed ? '✅ PASS' : '❌ FAIL'));

  console.log('');
  console.log(`Total: ${passed}/${total} test suites passed (${(totalDuration / 1000).toFixed(1)}s)`);
  console.log('━'.repeat(60));

  // Show failures
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('');
    console.log('❌ Failed Test Suites:');
    failures.forEach(f => {
      console.log(`   - ${f.name}`);
    });

    // Show detailed error output
    console.log('');
    console.log('━'.repeat(60));
    console.log('📋 FAILURE DETAILS');
    console.log('━'.repeat(60));
    console.log('');

    failures.forEach(failure => {
      console.log(`❌ ${failure.name}:`);
      console.log('');

      if (failure.output) {
        // Show last 50 lines of error output to avoid overwhelming the console
        const lines = failure.output.split('\n');
        const relevantLines = lines.slice(-50);
        console.log(relevantLines.join('\n'));
      } else {
        console.log('   (No error output available)');
      }

      console.log('');
      console.log('─'.repeat(60));
      console.log('');
    });
  }
}

main();
