/**
 * Master Test Runner - npm test
 * Orchestrates all testing against local Supabase instance
 *
 * Architecture:
 *   - Shared instance: port 54321 (both dev and test use same instance)
 *   - Snapshots dev database before running tests
 *   - Restores dev database automatically after tests complete
 *   - Dev data always preserved (site_settings, images, etc.)
 *
 * Prerequisites:
 *   - Local Supabase must be running: npm run supabase:start
 *   - Dev database should have data to preserve
 *
 * What this script does:
 *   1. Verifies Supabase is running on localhost:54321
 *   2. Creates snapshot of current dev database state
 *   3. Runs all tests (unit + integration)
 *   4. Restores dev database to pre-test state
 *   5. Reports results
 */

// IMPORTANT: Load test environment variables BEFORE any other imports
// tsx (TypeScript executor) doesn't automatically load .env files like next/jest does
// Jest tests will still use next/jest automatic loading - this is only for the runner script itself
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env.local"),
  override: true,
});

import { spawn } from "child_process";
import {
  verifyTestEnvironment,
  getTestEnvironmentInfo,
} from "../../tests/setup/env";

// NOTE: test-snapshot functions are imported dynamically inside main()
// to ensure environment variables are fully loaded before ImportService/RollbackService
// are instantiated (which import src/lib/supabase/client.ts at module level)

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
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// Spinner frames for progress indication
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let spinnerIndex = 0;
let spinnerInterval: NodeJS.Timeout | null = null;

function startSpinner(message: string): void {
  spinnerIndex = 0;
  process.stdout.write(
    `\r${COLORS.cyan}${SPINNER_FRAMES[0]}${COLORS.reset} ${message}`
  );

  spinnerInterval = setInterval(() => {
    spinnerIndex = (spinnerIndex + 1) % SPINNER_FRAMES.length;
    process.stdout.write(
      `\r${COLORS.cyan}${SPINNER_FRAMES[spinnerIndex]}${COLORS.reset} ${message}`
    );
  }, 80);
}

function stopSpinner(
  success: boolean,
  message: string,
  duration: number
): void {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }

  const icon = success ? "✅" : "❌";
  const color = success ? COLORS.green : COLORS.yellow;
  const durationText = `${COLORS.dim}(${(duration / 1000).toFixed(1)}s)${COLORS.reset}`;
  process.stdout.write(
    `\r${icon} ${color}${message}${COLORS.reset} ${durationText}\n`
  );
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

    const [cmd, ...args] = command.includes("&&")
      ? ["sh", "-c", command]
      : command.split(" ");

    const child = spawn(cmd, args, {
      shell: true,
      env: { ...process.env },
    });

    let output = "";
    let errorOutput = "";

    if (showOutput) {
      stopSpinner(true, name, 0);
      console.log(`${COLORS.dim}${"─".repeat(60)}${COLORS.reset}`);
    }

    child.stdout?.on("data", (data) => {
      const text = data.toString();
      output += text;
      if (showOutput) {
        process.stdout.write(text);
      }
    });

    child.stderr?.on("data", (data) => {
      const text = data.toString();
      errorOutput += text;
      if (showOutput) {
        process.stderr.write(text);
      }
    });

    child.on("close", (code) => {
      const duration = Date.now() - start;
      const passed = code === 0;

      if (!showOutput) {
        stopSpinner(passed, name, duration);
      } else {
        console.log(`${COLORS.dim}${"─".repeat(60)}${COLORS.reset}`);
        const icon = passed ? "✅" : "❌";
        const color = passed ? COLORS.green : COLORS.yellow;
        const durationText = `${COLORS.dim}(${(duration / 1000).toFixed(1)}s)${COLORS.reset}`;
        console.log(`${icon} ${color}${name}${COLORS.reset} ${durationText}\n`);
      }

      resolve({
        name,
        passed,
        duration,
        output: output + errorOutput,
      });
    });
  });
}

async function main() {
  console.log(`${COLORS.bright}🧪 ACR AUTOMOTIVE TEST SUITE${COLORS.reset}`);
  console.log("━".repeat(60));
  console.log("");

  const results: TestResult[] = [];
  let totalStart = Date.now();
  let snapshotId: string | null = null;

  // Dynamically import snapshot functions after env vars are loaded
  // This prevents ImportService/RollbackService from loading src/lib/supabase/client.ts
  // before environment variables are available
  const { createTestSnapshot, restoreTestSnapshot, deleteTestSnapshot } =
    await import("../../tests/helpers/test-snapshot");

  // Verify test environment
  const envInfo = getTestEnvironmentInfo();
  console.log(`${COLORS.blue}📋 Test Environment:${COLORS.reset}`);
  console.log(
    `   Supabase URL: ${COLORS.cyan}${envInfo.supabaseUrl}${COLORS.reset}`
  );
  console.log(`   Using localhost: ${envInfo.isLocalhost ? "✅" : "❌"}`);
  console.log("");

  if (!envInfo.isLocalhost) {
    console.error("❌ ERROR: Tests must run against localhost!");
    console.error(
      "   Make sure local Supabase is running: npm run supabase:start"
    );
    process.exit(1);
  }

  // Define all tests upfront for progress tracking
  const totalTests = 5; // snapshot + type-check + jest + stress + restore
  let currentTest = 0;

  function getProgressPrefix(): string {
    return `${COLORS.dim}[${currentTest}/${totalTests}]${COLORS.reset}`;
  }

  try {
    // Create snapshot of current dev database
    console.log(`${COLORS.blue}💾 Database Snapshot${COLORS.reset}`);
    currentTest++;
    const snapshotStart = Date.now();
    startSpinner(`${getProgressPrefix()} Creating dev data snapshot`);
    try {
      snapshotId = await createTestSnapshot();
      const snapshotDuration = Date.now() - snapshotStart;
      stopSpinner(
        true,
        `${getProgressPrefix()} Dev data snapshot created`,
        snapshotDuration
      );
    } catch (error: any) {
      const snapshotDuration = Date.now() - snapshotStart;
      stopSpinner(
        false,
        `${getProgressPrefix()} Snapshot failed`,
        snapshotDuration
      );
      throw new Error(`Failed to create snapshot: ${error.message}`);
    }
    console.log("");

    try {
      // TypeScript validation
      console.log(`${COLORS.blue}📝 TypeScript Validation${COLORS.reset}`);
      currentTest++;
      results.push(
        await runCommandWithProgress(
          "npm run type-check",
          `${getProgressPrefix()} Type Check`
        )
      );
      console.log("");

      // Unit tests
      // Note: --runInBand runs tests sequentially to prevent database conflicts
      console.log(`${COLORS.blue}🧩 Unit Tests${COLORS.reset}`);
      currentTest++;
      results.push(
        await runCommandWithProgress(
          "jest --runInBand",
          `${getProgressPrefix()} Jest Unit Tests`
        )
      );
      console.log("");

      // Stress tests (27 functional acceptance tests — requires dev server on port 3000)
      console.log(`${COLORS.blue}🔗 Integration Tests${COLORS.reset}`);
      currentTest++;
      const devServerCheck = await fetch("http://localhost:3000").catch(() => null);
      if (!devServerCheck) {
        console.log(`${COLORS.yellow}⚠️  Dev server not running on port 3000 — skipping stress tests${COLORS.reset}`);
        console.log(`   Start with: npm.cmd run dev`);
        results.push({
          name: `${getProgressPrefix()} Stress Tests (27 tests)`,
          passed: false,
          duration: 0,
          output: "Dev server not running on port 3000",
        });
      } else {
        results.push(
          await runCommandWithProgress(
            "tsx scripts/stress-test-import.ts",
            `${getProgressPrefix()} Stress Tests (27 tests)`,
            true
          )
        );
      }
      console.log("");

      // Generate report
      const totalDuration = Date.now() - totalStart;
      generateReport(results, totalDuration);

      // Restore dev database (always runs, even if tests failed)
    } finally {
      if (snapshotId) {
        console.log("");
        console.log(`${COLORS.blue}🔄 Database Restore${COLORS.reset}`);
        const restoreStart = Date.now();
        startSpinner("Restoring dev data from snapshot");
        try {
          await restoreTestSnapshot(snapshotId);
          await deleteTestSnapshot(snapshotId);
          const restoreDuration = Date.now() - restoreStart;
          stopSpinner(true, "Dev data restored successfully", restoreDuration);
        } catch (error: any) {
          const restoreDuration = Date.now() - restoreStart;
          stopSpinner(false, "Restore failed", restoreDuration);
          console.error(
            `${COLORS.yellow}⚠️  Warning: Failed to restore database: ${error.message}${COLORS.reset}`
          );
          console.error(
            `   You may need to manually reset: npm run supabase:reset`
          );
        }
      }
    }

    // Exit with appropriate code
    const allPassed = results.every((r) => r.passed);
    process.exit(allPassed ? 0 : 1);
  } catch (error: any) {
    console.error("❌ Fatal error:", error.message);

    // Attempt to restore database even on fatal error
    if (snapshotId) {
      console.log("");
      console.log("Attempting to restore database after fatal error...");
      try {
        await restoreTestSnapshot(snapshotId);
        await deleteTestSnapshot(snapshotId);
        console.log("✅ Database restored");
      } catch (restoreError: any) {
        console.error(
          `⚠️  Failed to restore database: ${restoreError.message}`
        );
        console.error(
          "   You may need to manually reset: npm run supabase:reset"
        );
      }
    }

    process.exit(1);
  }
}

function generateReport(results: TestResult[], totalDuration: number) {
  console.log("━".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  // Header with color coding
  if (allPassed) {
    console.log(
      `${COLORS.green}${COLORS.bright}✅ ALL TESTS PASSED${COLORS.reset}`
    );
  } else {
    console.log(
      `${COLORS.yellow}${COLORS.bright}❌ SOME TESTS FAILED${COLORS.reset}`
    );
  }
  console.log("");

  // Service-level summary with enhanced formatting
  const stressTestsPassed =
    results.find((r) => r.name.includes("Stress Tests"))?.passed ?? false;
  const unitTestsPassed =
    results.find((r) => r.name.includes("Jest Unit Tests"))?.passed ?? false;

  console.log(`${COLORS.blue}📦 Service Health:${COLORS.reset}`);
  console.log(
    "   Import Pipeline:       " +
      (stressTestsPassed
        ? `${COLORS.green}✅ PASS${COLORS.reset}`
        : `${COLORS.yellow}❌ FAIL${COLORS.reset}`) +
      ` ${COLORS.dim}(27 stress tests)${COLORS.reset}`
  );
  console.log(
    "   Unit Tests:            " +
      (unitTestsPassed
        ? `${COLORS.green}✅ PASS${COLORS.reset}`
        : `${COLORS.yellow}❌ FAIL${COLORS.reset}`) +
      ` ${COLORS.dim}(workbook builder, malformed files, search)${COLORS.reset}`
  );

  console.log("");

  // Performance summary
  const avgDuration = totalDuration / total;
  console.log(`${COLORS.blue}⚡ Performance:${COLORS.reset}`);
  console.log(
    `   Total Duration: ${COLORS.cyan}${(totalDuration / 1000).toFixed(1)}s${COLORS.reset}`
  );
  console.log(
    `   Average per Test: ${COLORS.cyan}${(avgDuration / 1000).toFixed(1)}s${COLORS.reset}`
  );
  console.log(
    `   Tests Passed: ${COLORS.green}${passed}${COLORS.reset}/${total}`
  );

  console.log("");
  console.log("━".repeat(60));

  // Show failures
  const failures = results.filter((r) => !r.passed);
  if (failures.length > 0) {
    console.log("");
    console.log("❌ Failed Test Suites:");
    failures.forEach((f) => {
      console.log(`   - ${f.name}`);
    });

    // Show detailed error output
    console.log("");
    console.log("━".repeat(60));
    console.log("📋 FAILURE DETAILS");
    console.log("━".repeat(60));
    console.log("");

    failures.forEach((failure) => {
      console.log(`❌ ${failure.name}:`);
      console.log("");

      if (failure.output) {
        // Show last 50 lines of error output to avoid overwhelming the console
        const lines = failure.output.split("\n");
        const relevantLines = lines.slice(-50);
        console.log(relevantLines.join("\n"));
      } else {
        console.log("   (No error output available)");
      }

      console.log("");
      console.log("─".repeat(60));
      console.log("");
    });
  }
}

main();
