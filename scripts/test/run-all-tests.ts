/**
 * Master Test Runner - npm test
 * Orchestrates all testing against local Supabase instance
 *
 * Architecture:
 *   - Shared instance: port 54321 (both dev and test use same instance)
 *   - Tests reset database before running (npm run supabase:reset)
 *   - After tests complete, database is left empty
 *   - To restore dev data: npm run supabase:reset
 *
 * Prerequisites:
 *   - Local Supabase must be running: npm run supabase:start
 *   - Tests will reset database automatically
 *
 * What this script does:
 *   1. Verifies Supabase is running on localhost:54321
 *   2. Resets database to clean state (runs migrations)
 *   3. Runs all tests (unit + integration)
 *   4. Reports results
 */

// IMPORTANT: Load test environment variables BEFORE any other imports
// tsx (TypeScript executor) doesn't automatically load .env files like next/jest does
// Jest tests will still use next/jest automatic loading - this is only for the runner script itself
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(process.cwd(), '.env.test.local'),
  override: true
});

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { verifyTestEnvironment, getTestEnvironmentInfo } from '../../tests/setup/env';

const execAsync = promisify(exec);

// Verify test environment is loaded correctly by Next.js
verifyTestEnvironment();

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  output?: string;
}

// ANSI escape codes for terminal formatting
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Spinner frames for progress indication
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerIndex = 0;
let spinnerInterval: NodeJS.Timeout | null = null;

function startSpinner(message: string): void {
  spinnerIndex = 0;
  process.stdout.write(`\r${COLORS.cyan}${SPINNER_FRAMES[0]}${COLORS.reset} ${message}`);

  spinnerInterval = setInterval(() => {
    spinnerIndex = (spinnerIndex + 1) % SPINNER_FRAMES.length;
    process.stdout.write(`\r${COLORS.cyan}${SPINNER_FRAMES[spinnerIndex]}${COLORS.reset} ${message}`);
  }, 80);
}

function stopSpinner(success: boolean, message: string, duration: number): void {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }

  const icon = success ? '✅' : '❌';
  const color = success ? COLORS.green : COLORS.yellow;
  const durationText = `${COLORS.dim}(${(duration / 1000).toFixed(1)}s)${COLORS.reset}`;
  process.stdout.write(`\r${icon} ${color}${message}${COLORS.reset} ${durationText}\n`);
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

/**
 * Run command with real-time output streaming
 * Shows live output as the test runs instead of buffering
 */
async function runCommandWithProgress(
  command: string,
  name: string,
  showOutput: boolean = false
): Promise<TestResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    startSpinner(name);

    const [cmd, ...args] = command.includes('&&')
      ? ['sh', '-c', command]
      : command.split(' ');

    const child = spawn(cmd, args, {
      shell: true,
      env: { ...process.env }
    });

    let output = '';
    let errorOutput = '';

    if (showOutput) {
      stopSpinner(true, name, 0);
      console.log(`${COLORS.dim}${'─'.repeat(60)}${COLORS.reset}`);
    }

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (showOutput) {
        process.stdout.write(text);
      }
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      if (showOutput) {
        process.stderr.write(text);
      }
    });

    child.on('close', (code) => {
      const duration = Date.now() - start;
      const passed = code === 0;

      if (!showOutput) {
        stopSpinner(passed, name, duration);
      } else {
        console.log(`${COLORS.dim}${'─'.repeat(60)}${COLORS.reset}`);
        const icon = passed ? '✅' : '❌';
        const color = passed ? COLORS.green : COLORS.yellow;
        const durationText = `${COLORS.dim}(${(duration / 1000).toFixed(1)}s)${COLORS.reset}`;
        console.log(`${icon} ${color}${name}${COLORS.reset} ${durationText}\n`);
      }

      resolve({
        name,
        passed,
        duration,
        output: output + errorOutput
      });
    });
  });
}

async function main() {
  console.log(`${COLORS.bright}🧪 ACR AUTOMOTIVE TEST SUITE${COLORS.reset}`);
  console.log('━'.repeat(60));
  console.log('');

  const results: TestResult[] = [];
  let totalStart = Date.now();

  // Verify test environment
  const envInfo = getTestEnvironmentInfo();
  console.log(`${COLORS.blue}📋 Test Environment:${COLORS.reset}`);
  console.log(`   Supabase URL: ${COLORS.cyan}${envInfo.supabaseUrl}${COLORS.reset}`);
  console.log(`   Using localhost: ${envInfo.isLocalhost ? '✅' : '❌'}`);
  console.log('');

  if (!envInfo.isLocalhost) {
    console.error('❌ ERROR: Tests must run against localhost!');
    console.error('   Make sure local Supabase is running: npm run supabase:start');
    process.exit(1);
  }

  // Define all tests upfront for progress tracking
  const totalTests = 10;
  let currentTest = 0;

  function getProgressPrefix(): string {
    return `${COLORS.dim}[${currentTest}/${totalTests}]${COLORS.reset}`;
  }

  try {
    // TypeScript validation
    console.log(`${COLORS.blue}📝 TypeScript Validation${COLORS.reset}`);
    currentTest++;
    results.push(await runCommandWithProgress('npm run type-check', `${getProgressPrefix()} Type Check`));
    console.log('');

    // Unit tests
    // Note: --runInBand runs tests sequentially to prevent database conflicts
    console.log(`${COLORS.blue}🧩 Unit Tests${COLORS.reset}`);
    currentTest++;
    results.push(await runCommandWithProgress('jest --runInBand', `${getProgressPrefix()} Jest Unit Tests`));
    console.log('');

    // Integration tests (Direct Supabase client - works with local Docker DB)
    // Note: API route tests (test-api-*.ts) are excluded - they require dev server
    console.log(`${COLORS.blue}🔗 Integration Tests${COLORS.reset}`);
    currentTest++;
    results.push(await runCommandWithProgress(
      'cross-env NODE_ENV=test tsx scripts/test/test-all-fixtures.ts',
      `${getProgressPrefix()} Fixture Validation`
    ));

    // Reset database before import pipeline test to ensure consistent state
    // Import pipeline expects either empty DB or properly seeded DB
    currentTest++;
    results.push(await runCommandWithProgress(
      'npm run supabase:reset',
      `${getProgressPrefix()} Database Reset (Pre-Import)`
    ));

    currentTest++;
    results.push(await runCommandWithProgress(
      'cross-env NODE_ENV=test tsx scripts/test/test-full-import-pipeline.ts',
      `${getProgressPrefix()} Import Pipeline`
    ));

    currentTest++;
    results.push(await runCommandWithProgress(
      'tsx scripts/test/test-atomic-constraint-violation.ts',
      `${getProgressPrefix()} Atomic Constraint Test`
    ));

    currentTest++;
    results.push(await runCommandWithProgress(
      'tsx scripts/test/test-atomic-fk-violation.ts',
      `${getProgressPrefix()} Atomic FK Test`
    ));

    currentTest++;
    results.push(await runCommandWithProgress(
      'jest tests/integration/atomic-import-rpc.test.ts',
      `${getProgressPrefix()} Atomic Import RPC Tests`
    ));

    currentTest++;
    results.push(await runCommandWithProgress(
      'jest tests/integration/rollback-service.test.ts',
      `${getProgressPrefix()} Rollback Service Tests`
    ));

    currentTest++;
    results.push(await runCommandWithProgress(
      'jest tests/integration/import-service.test.ts',
      `${getProgressPrefix()} Import Service Tests`
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
  }
}

function generateReport(results: TestResult[], totalDuration: number) {
  console.log('━'.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  // Header with color coding
  if (allPassed) {
    console.log(`${COLORS.green}${COLORS.bright}✅ ALL TESTS PASSED${COLORS.reset}`);
  } else {
    console.log(`${COLORS.yellow}${COLORS.bright}❌ SOME TESTS FAILED${COLORS.reset}`);
  }
  console.log('');

  // Service-level summary with enhanced formatting
  const importPipelinePassed = results.find(r => r.name.includes('Import Pipeline'))?.passed ?? false;
  const fixtureValidationPassed = results.find(r => r.name.includes('Fixture Validation'))?.passed ?? false;
  const atomicPassed = results.filter(r => r.name.includes('Atomic')).every(r => r.passed);
  const unitTestsPassed = results.find(r => r.name.includes('Jest Unit Tests'))?.passed ?? false;

  console.log(`${COLORS.blue}📦 Service Health:${COLORS.reset}`);
  console.log('   Import Service:        ' + (importPipelinePassed ? `${COLORS.green}✅ PASS${COLORS.reset}` : `${COLORS.yellow}❌ FAIL${COLORS.reset}`));
  console.log('   Export Service:        ' + (unitTestsPassed ? `${COLORS.green}✅ PASS${COLORS.reset}` : `${COLORS.yellow}❌ FAIL${COLORS.reset}`) + ` ${COLORS.dim}(covered in unit tests)${COLORS.reset}`);
  console.log('   Validation Engine:     ' + (fixtureValidationPassed ? `${COLORS.green}✅ PASS${COLORS.reset}` : `${COLORS.yellow}❌ FAIL${COLORS.reset}`));
  console.log('   Atomic Transactions:   ' + (atomicPassed ? `${COLORS.green}✅ PASS${COLORS.reset}` : `${COLORS.yellow}❌ FAIL${COLORS.reset}`));

  console.log('');

  // Performance summary
  const avgDuration = totalDuration / total;
  console.log(`${COLORS.blue}⚡ Performance:${COLORS.reset}`);
  console.log(`   Total Duration: ${COLORS.cyan}${(totalDuration / 1000).toFixed(1)}s${COLORS.reset}`);
  console.log(`   Average per Test: ${COLORS.cyan}${(avgDuration / 1000).toFixed(1)}s${COLORS.reset}`);
  console.log(`   Tests Passed: ${COLORS.green}${passed}${COLORS.reset}/${total}`);

  console.log('');
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
