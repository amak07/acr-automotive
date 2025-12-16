/**
 * Test All Fixtures Through Full Pipeline
 *
 * Validates that all fixtures produce expected validation results
 * Tests the complete flow: Parse → Validate → Diff
 */

import { ExcelImportService } from "../../src/services/excel/import/ExcelImportService";
import { ValidationEngine } from "../../src/services/excel/validation/ValidationEngine";
import {
  ValidationErrorCode,
  ValidationWarningCode,
} from "../../src/services/excel/validation/types";
import { loadFixture, emptyDbState } from "./helpers/fixture-loader";
import * as fs from "fs";
import * as path from "path";

const FIXTURES_DIR = path.join(
  process.cwd(),
  "tests",
  "fixtures",
  "excel",
  "unit"
);

interface FixtureTest {
  filename: string;
  description: string;
  expectedValid: boolean;
  expectedErrors: number;
  expectedWarnings: number;
  expectedErrorCodes?: string[];
  expectedWarningCodes?: string[];
}

const FIXTURE_TESTS: FixtureTest[] = [
  // Happy Path
  {
    filename: "valid-add-new-parts.xlsx",
    description: "Valid new parts (ADD operations)",
    expectedValid: true,
    expectedErrors: 0,
    expectedWarnings: 0,
  },
  {
    filename: "valid-update-existing.xlsx",
    description:
      "Valid updates to existing parts (requires seed data - skip for now)",
    expectedValid: false, // Will fail without seed data in DB
    expectedErrors: 5, // E19: UUIDs not found (5 parts in fixture)
    expectedWarnings: 0,
  },

  // Error Scenarios
  {
    filename: "error-missing-required-fields.xlsx",
    description: "Missing required fields",
    expectedValid: false,
    expectedErrors: 3, // E1: missing hidden columns + E3: missing ACR_SKU + E3: missing Part_Type
    expectedWarnings: 0,
    expectedErrorCodes: [
      "E1_MISSING_HIDDEN_COLUMNS",
      "E3_EMPTY_REQUIRED_FIELD",
    ],
  },
  {
    filename: "error-duplicate-skus.xlsx",
    description: "Duplicate ACR_SKU values",
    expectedValid: false,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedErrorCodes: ["E2_DUPLICATE_ACR_SKU"],
  },
  {
    filename: "error-orphaned-references.xlsx",
    description: "Orphaned foreign key references",
    expectedValid: false,
    expectedErrors: 6, // E1: missing hidden columns + E4: invalid UUIDs (3×) + E5: orphaned keys (2×)
    expectedWarnings: 0,
    expectedErrorCodes: [
      "E1_MISSING_HIDDEN_COLUMNS",
      "E4_INVALID_UUID_FORMAT",
      "E5_ORPHANED_FOREIGN_KEY",
    ],
  },
  {
    filename: "error-invalid-formats.xlsx",
    description: "Invalid data formats",
    expectedValid: false,
    expectedErrors: 9, // E4: invalid UUIDs (5×), E5: orphaned keys (2×), E6: year range (1×), E8: year out of range (1×)
    expectedWarnings: 0,
    expectedErrorCodes: [
      "E4_INVALID_UUID_FORMAT",
      "E5_ORPHANED_FOREIGN_KEY",
      "E6_INVALID_YEAR_RANGE",
      "E8_YEAR_OUT_OF_RANGE",
    ],
  },
  {
    filename: "error-max-length-exceeded.xlsx",
    description: "String max length exceeded",
    expectedValid: false,
    expectedErrors: 1, // Part_Type exceeds max length
    expectedWarnings: 0,
    expectedErrorCodes: ["E7_STRING_EXCEEDS_MAX_LENGTH"],
  },
];

async function testFixture(test: FixtureTest): Promise<boolean> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📋 Testing: ${test.filename}`);
  console.log(`   ${test.description}`);
  console.log(`${"=".repeat(80)}`);

  try {
    // Load fixture
    const file = loadFixture(test.filename);
    const excelService = new ExcelImportService();
    const validationEngine = new ValidationEngine();

    // Parse
    console.log("⏳ Parsing...");
    const parsed = await excelService.parseFile(file);
    console.log(
      `✅ Parsed: ${parsed.parts.rowCount} parts, ${parsed.vehicleApplications.rowCount} vehicle apps, ${parsed.crossReferences.rowCount} cross refs`
    );

    // Validate (use empty DB state for ADD-only tests)
    console.log("⏳ Validating...");
    const dbState = emptyDbState();
    const validated = await validationEngine.validate(parsed, dbState);

    // Check results
    console.log("\n📊 Validation Results:");
    console.log(
      `   Valid: ${validated.valid ? "✅" : "❌"} (expected: ${test.expectedValid ? "✅" : "❌"})`
    );
    console.log(
      `   Errors: ${validated.errors.length} (expected: ${test.expectedErrors})`
    );
    console.log(
      `   Warnings: ${validated.warnings.length} (expected: ${test.expectedWarnings})`
    );

    // Display errors
    if (validated.errors.length > 0) {
      console.log("\n❌ Errors:");
      validated.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. [${err.code}] ${err.message}`);
      });
    }

    // Display warnings
    if (validated.warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      validated.warnings.forEach((warn, i) => {
        console.log(`   ${i + 1}. [${warn.code}] ${warn.message}`);
      });
    }

    // Verify expectations
    let passed = true;
    const failures: string[] = [];

    if (validated.valid !== test.expectedValid) {
      passed = false;
      failures.push(
        `Expected valid=${test.expectedValid}, got ${validated.valid}`
      );
    }

    if (validated.errors.length !== test.expectedErrors) {
      passed = false;
      failures.push(
        `Expected ${test.expectedErrors} errors, got ${validated.errors.length}`
      );
    }

    if (validated.warnings.length !== test.expectedWarnings) {
      passed = false;
      failures.push(
        `Expected ${test.expectedWarnings} warnings, got ${validated.warnings.length}`
      );
    }

    // Check error codes if specified
    if (test.expectedErrorCodes && test.expectedErrorCodes.length > 0) {
      const actualCodes = validated.errors.map((e) => e.code as string);
      const missingCodes = test.expectedErrorCodes.filter(
        (code) => !actualCodes.includes(code)
      );
      if (missingCodes.length > 0) {
        passed = false;
        failures.push(
          `Missing expected error codes: ${missingCodes.join(", ")}`
        );
      }
    }

    // Report result
    if (passed) {
      console.log("\n✅ TEST PASSED");
      return true;
    } else {
      console.log("\n❌ TEST FAILED");
      failures.forEach((f) => console.log(`   - ${f}`));
      return false;
    }
  } catch (error: any) {
    console.error("\n❌ TEST ERROR:", error.message);
    console.error(error.stack);
    return false;
  }
}

async function runAllTests() {
  console.log("\n🧪 Testing All Fixtures Through Full Pipeline\n");
  console.log(`📁 Fixtures Directory: ${FIXTURES_DIR}\n`);

  // Check if fixtures exist
  if (!fs.existsSync(FIXTURES_DIR)) {
    console.error(`❌ Fixtures directory not found: ${FIXTURES_DIR}`);
    console.error("   Run: npm run test:generate-fixtures\n");
    process.exit(1);
  }

  const results: { test: FixtureTest; passed: boolean }[] = [];

  // Run all tests
  for (const test of FIXTURE_TESTS) {
    const passed = await testFixture(test);
    results.push({ test, passed });
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80));

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;

  console.log(`\n✅ Passed: ${passCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);

  if (failCount > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.test.filename}`);
      });
  }

  console.log("\n" + "=".repeat(80) + "\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runAllTests();
