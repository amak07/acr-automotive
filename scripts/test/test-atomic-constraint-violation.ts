/**
 * Test Atomic Transaction: Constraint Violation Rollback
 *
 * Uses existing fixture: error-duplicate-skus.xlsx
 *
 * Tests that when a duplicate SKU constraint violation occurs,
 * ALL changes in the transaction are rolled back (all-or-nothing).
 *
 * Strategy:
 * 1. Record initial database counts
 * 2. Import fixture with duplicate SKUs
 * 3. Verify import FAILS (validation catches it, or DB constraint catches it)
 * 4. Verify database unchanged (zero rows inserted)
 *
 * ⚠️  WARNING: This MODIFIES the database!
 * ⚠️  Uses .env.test to point to test database only
 *
 * Usage:
 *   npm run test:atomic:constraint
 */

import * as path from "path";
import * as dotenv from "dotenv";
import { ExcelImportService } from "../../src/services/excel/import/ExcelImportService";
import { ValidationEngine } from "../../src/services/excel/validation/ValidationEngine";
import { DiffEngine } from "../../src/services/excel/diff/DiffEngine";
import { ImportService } from "../../src/services/excel/import/ImportService";
import { createClient } from "@supabase/supabase-js";
import { loadFixture, emptyDbState } from "./helpers/fixture-loader";

// Load test environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.test") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// Helper Functions
// =====================================================

interface DatabaseCounts {
  parts: number;
  vehicles: number;
  crossRefs: number;
}

async function getDatabaseCounts(): Promise<DatabaseCounts> {
  const { count: partsCount } = await supabase
    .from("parts")
    .select("*", { count: "exact", head: true });

  const { count: vehiclesCount } = await supabase
    .from("vehicle_applications")
    .select("*", { count: "exact", head: true });

  const { count: crossRefsCount } = await supabase
    .from("cross_references")
    .select("*", { count: "exact", head: true });

  return {
    parts: partsCount || 0,
    vehicles: vehiclesCount || 0,
    crossRefs: crossRefsCount || 0,
  };
}

async function fetchExistingData() {
  const { data: parts } = await supabase.from("parts").select("*");
  const { data: vehicles } = await supabase
    .from("vehicle_applications")
    .select("*");
  const { data: crossRefs } = await supabase
    .from("cross_references")
    .select("*");

  const partsMap = new Map();
  const partSkus = new Set<string>();
  (parts || []).forEach((part: any) => {
    partsMap.set(part.id, part);
    partSkus.add(part.acr_sku);
  });

  const vehiclesMap = new Map();
  (vehicles || []).forEach((vehicle: any) => {
    vehiclesMap.set(vehicle.id, vehicle);
  });

  const crossRefsMap = new Map();
  (crossRefs || []).forEach((crossRef: any) => {
    crossRefsMap.set(crossRef.id, crossRef);
  });

  return {
    parts: partsMap,
    vehicleApplications: vehiclesMap,
    crossReferences: crossRefsMap,
    partSkus,
  };
}

// =====================================================
// Main Test
// =====================================================

async function runTest() {
  console.log("🧪 TEST: Atomic Transaction - Constraint Violation Rollback\n");
  console.log("=" .repeat(70));
  console.log("");
  console.log("Fixture: error-duplicate-skus.xlsx");
  console.log("Expected: Validation catches duplicate, OR database rollback if bypassed");
  console.log("");
  console.log("=" .repeat(70));
  console.log("");

  try {
    // STEP 1: Record initial database state
    console.log("📊 Step 1: Recording initial database state...\n");
    const initialCounts = await getDatabaseCounts();
    console.log(`   Parts: ${initialCounts.parts}`);
    console.log(`   Vehicles: ${initialCounts.vehicles}`);
    console.log(`   Cross References: ${initialCounts.crossRefs}`);
    console.log("");

    // STEP 2: Load fixture
    console.log("📝 Step 2: Loading fixture with duplicate SKUs...\n");
    const file = loadFixture("error-duplicate-skus.xlsx");
    console.log(`   ✅ Loaded error-duplicate-skus.xlsx`);
    console.log(`   Contains: DUP-001 (twice), DUP-002 (once)`);
    console.log("");

    // STEP 3: Parse Excel
    console.log("📖 Step 3: Parsing Excel...\n");
    const parser = new ExcelImportService();
    const parsed = await parser.parseFile(file);
    console.log(`   ✅ Parsed ${parsed.parts.data.length} parts`);
    console.log("");

    // STEP 4: Fetch existing data
    console.log("🔍 Step 4: Fetching existing database data...\n");
    const existingData = await fetchExistingData();
    console.log(`   ✅ Loaded ${existingData.partSkus.size} existing SKUs`);
    console.log("");

    // STEP 5: Validate
    console.log("✅ Step 5: Running validation...\n");
    const validator = new ValidationEngine();
    const validation = await validator.validate(parsed, existingData);

    if (!validation.valid) {
      console.log(`   ⚠️  Validation caught errors (EXPECTED):`);
      const duplicateErrors = validation.errors.filter(e => e.code === 'E2_DUPLICATE_SKU_IN_FILE');
      console.log(`      Found ${duplicateErrors.length} duplicate SKU error(s)`);
      if (duplicateErrors.length > 0) {
        duplicateErrors.forEach(err => {
          console.log(`      - ${err.message}`);
        });
      }
      console.log("");
      console.log("   ✅ VALIDATION WORKING: Duplicate caught before database");
      console.log("   ℹ️  Database protection not needed - validation prevents bad import");
      console.log("");

      // Verify database unchanged
      const finalCounts = await getDatabaseCounts();
      const partsDiff = finalCounts.parts - initialCounts.parts;

      if (partsDiff === 0) {
        console.log("=" .repeat(70));
        console.log("🎉 TEST PASSED: Validation prevented duplicate SKU import!");
        console.log("=" .repeat(70));
        console.log("");
        process.exit(0);
      } else {
        console.log("❌ ERROR: Database changed despite validation errors!");
        process.exit(1);
      }
    }

    // If validation passes (unexpected), try importing anyway to test DB constraint
    console.log("   ⚠️  Validation passed (unexpected) - testing database constraint...\n");

    // STEP 6: Generate diff
    console.log("🔄 Step 6: Generating diff...\n");
    const differ = new DiffEngine();
    const diff = differ.generateDiff(parsed, existingData);
    console.log(`   Parts to add: ${diff.parts.toAdd.length}`);
    console.log("");

    // STEP 7: Attempt import (should fail at database level)
    console.log("💾 Step 7: Attempting import (expecting DB constraint violation)...\n");

    const importer = new ImportService();
    let importFailed = false;

    try {
      await importer.executeImport(parsed, diff, existingData, {
        filename: "error-duplicate-skus.xlsx",
        uploadedBy: "test-system",
      });

      console.log("   ❌ ERROR: Import should have failed but succeeded!");
      process.exit(1);
    } catch (error: any) {
      importFailed = true;
      console.log(`   ✅ Import failed as expected`);
      console.log(`   Error: ${error.message}`);
      console.log("");
    }

    // STEP 8: Verify database state unchanged
    console.log("🔍 Step 8: Verifying database state unchanged...\n");
    const finalCounts = await getDatabaseCounts();

    const partsDiff = finalCounts.parts - initialCounts.parts;
    const vehiclesDiff = finalCounts.vehicles - initialCounts.vehicles;
    const crossRefsDiff = finalCounts.crossRefs - initialCounts.crossRefs;

    console.log(`   Initial Parts: ${initialCounts.parts}`);
    console.log(`   Final Parts: ${finalCounts.parts} (diff: ${partsDiff})`);
    console.log("");

    if (partsDiff === 0 && vehiclesDiff === 0 && crossRefsDiff === 0) {
      console.log("✅ SUCCESS: Database constraint prevented duplicate!");
      console.log("   ✅ Zero records inserted");
      console.log("   ✅ Transaction rolled back completely");
      console.log("");
      console.log("=" .repeat(70));
      console.log("🎉 TEST PASSED: Atomic transaction rollback works!");
      console.log("=" .repeat(70));
      console.log("");
      process.exit(0);
    } else {
      console.log("❌ FAILURE: Database state changed!");
      console.log(`   ${partsDiff} parts inserted - SHOULD BE ZERO!`);
      console.log("");
      console.log("=" .repeat(70));
      console.log("❌ TEST FAILED: Atomic rollback not working!");
      console.log("=" .repeat(70));
      console.log("");
      process.exit(1);
    }
  } catch (error: any) {
    console.log("");
    console.log("💥 TEST ERROR:");
    console.log(error);
    console.log("");
    process.exit(1);
  }
}

runTest();
