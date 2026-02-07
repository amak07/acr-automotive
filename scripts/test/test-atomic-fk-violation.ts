// @ts-nocheck
/**
 * Test Atomic Transaction: Foreign Key Violation Rollback
 *
 * Uses existing fixture: error-orphaned-references.xlsx
 *
 * Tests that when a foreign key constraint violation occurs,
 * ALL changes in ALL tables are rolled back (multi-table atomicity).
 *
 * Strategy:
 * 1. Record initial database counts
 * 2. Import fixture with orphaned reference (vehicle → non-existent part)
 * 3. Verify import FAILS (validation catches it, or DB FK constraint catches it)
 * 4. Verify database unchanged (INCLUDING valid parts that were in the file)
 *
 * ⚠️  WARNING: This MODIFIES the database!
 * ⚠️  Uses .env.local to point to local test database
 *
 * Usage:
 *   npm run test:atomic:fk
 */

// IMPORTANT: Load test environment variables BEFORE any other imports
// tsx (TypeScript executor) doesn't automatically load .env files
import dotenv from "dotenv";
import * as path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env.local"),
  override: true,
});

import { verifyTestEnvironment } from "../../tests/setup/env";
import { ExcelImportService } from "../../src/services/excel/import/ExcelImportService";
import { ValidationEngine } from "../../src/services/excel/validation/ValidationEngine";
import { DiffEngine } from "../../src/services/excel/diff/DiffEngine";
import { ImportService } from "../../src/services/excel/import/ImportService";
import { createClient } from "@supabase/supabase-js";
import { loadFixture } from "./helpers/fixture-loader";

// Verify test environment is configured correctly
verifyTestEnvironment();

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
  console.log("🧪 TEST: Atomic Transaction - Foreign Key Violation Rollback\n");
  console.log("=".repeat(70));
  console.log("");
  console.log("Fixture: error-orphaned-references.xlsx");
  console.log("Contains:");
  console.log("  - Part: ORPHAN-001 (valid)");
  console.log("  - Vehicle: ORPHAN-001 → ORPHAN-001 part (valid FK)");
  console.log("  - Vehicle: NON-EXISTENT-SKU → ??? (INVALID FK)");
  console.log("");
  console.log(
    "Expected: Validation catches orphan, OR database rollback if bypassed"
  );
  console.log(
    "Critical: If import fails, ORPHAN-001 part should NOT be inserted"
  );
  console.log("");
  console.log("=".repeat(70));
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
    console.log("📝 Step 2: Loading fixture with orphaned reference...\n");
    const file = loadFixture("error-orphaned-references.xlsx");
    console.log(`   ✅ Loaded error-orphaned-references.xlsx`);
    console.log("");

    // STEP 3: Parse Excel
    console.log("📖 Step 3: Parsing Excel...\n");
    const parser = new ExcelImportService();
    const parsed = await parser.parseFile(file);
    console.log(`   ✅ Parsed ${parsed.parts.data.length} parts`);
    console.log(
      `   ✅ Parsed ${parsed.vehicleApplications.data.length} vehicles`
    );
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
      const orphanErrors = validation.errors.filter(
        (e) => e.code === "E5_ORPHANED_FOREIGN_KEY"
      );
      console.log(
        `      Found ${orphanErrors.length} orphaned reference error(s)`
      );
      if (orphanErrors.length > 0) {
        orphanErrors.forEach((err) => {
          console.log(`      - ${err.message}`);
        });
      }
      console.log("");
      console.log(
        "   ✅ VALIDATION WORKING: Orphaned reference caught before database"
      );
      console.log(
        "   ℹ️  Database protection not needed - validation prevents bad import"
      );
      console.log("");

      // Verify database unchanged
      const finalCounts = await getDatabaseCounts();
      const partsDiff = finalCounts.parts - initialCounts.parts;

      if (partsDiff === 0) {
        console.log("=".repeat(70));
        console.log(
          "🎉 TEST PASSED: Validation prevented orphaned reference import!"
        );
        console.log("=".repeat(70));
        console.log("");
        process.exit(0);
      } else {
        console.log("❌ ERROR: Database changed despite validation errors!");
        process.exit(1);
      }
    }

    // If validation passes (unexpected), try importing anyway to test DB FK constraint
    console.log(
      "   ⚠️  Validation passed (unexpected) - testing database FK constraint...\n"
    );

    // STEP 6: Generate diff
    console.log("🔄 Step 6: Generating diff...\n");
    const differ = new DiffEngine();
    const diff = differ.generateDiff(parsed, existingData);
    console.log(`   Parts to add: ${diff.parts.adds.length}`);
    console.log(`   Vehicles to add: ${diff.vehicleApplications.adds.length}`);
    console.log("");

    // STEP 7: Attempt import (should fail at database FK level)
    console.log(
      "💾 Step 7: Attempting import (expecting DB FK violation)...\n"
    );

    const importer = new ImportService();
    let importFailed = false;

    try {
      await importer.executeImport(parsed, diff, {
        fileName: "error-orphaned-references.xlsx",
        fileSize: 0,
        uploadedAt: new Date(),
        importedBy: "test-system",
      });

      console.log("   ❌ ERROR: Import should have failed but succeeded!");
      process.exit(1);
    } catch (error: any) {
      importFailed = true;
      console.log(`   ✅ Import failed as expected`);
      console.log(`   Error: ${error.message}`);
      console.log("");
    }

    // STEP 8: Verify database state unchanged (INCLUDING parts!)
    console.log("🔍 Step 8: Verifying database state unchanged...\n");
    const finalCounts = await getDatabaseCounts();

    const partsDiff = finalCounts.parts - initialCounts.parts;
    const vehiclesDiff = finalCounts.vehicles - initialCounts.vehicles;
    const crossRefsDiff = finalCounts.crossRefs - initialCounts.crossRefs;

    console.log(`   Initial Parts: ${initialCounts.parts}`);
    console.log(`   Final Parts: ${finalCounts.parts} (diff: ${partsDiff})`);
    console.log("");
    console.log(`   Initial Vehicles: ${initialCounts.vehicles}`);
    console.log(
      `   Final Vehicles: ${finalCounts.vehicles} (diff: ${vehiclesDiff})`
    );
    console.log("");

    if (partsDiff === 0 && vehiclesDiff === 0 && crossRefsDiff === 0) {
      console.log("✅ SUCCESS: Multi-table atomic rollback verified!");
      console.log("");
      console.log("   ✅ Zero parts inserted (even though part was valid)");
      console.log("   ✅ Zero vehicles inserted");
      console.log("   ✅ Transaction rolled back completely");
      console.log("");
      console.log("   🎯 CRITICAL VERIFICATION:");
      console.log(
        "   The valid part (ORPHAN-001) was NOT inserted even though it was"
      );
      console.log(
        "   valid, because the vehicle FK violation occurred in the same"
      );
      console.log("   transaction. This proves TRUE multi-table atomicity!");
      console.log("");
      console.log("=".repeat(70));
      console.log("🎉 TEST PASSED: Multi-table atomic rollback works!");
      console.log("=".repeat(70));
      console.log("");
      process.exit(0);
    } else {
      console.log("❌ FAILURE: Database state changed!");
      console.log("");
      console.log("   Expected: Zero records inserted (complete rollback)");
      console.log(
        `   Actual: ${partsDiff} parts, ${vehiclesDiff} vehicles inserted`
      );
      console.log("");
      if (partsDiff > 0 && vehiclesDiff === 0) {
        console.log(
          "   ⚠️  CRITICAL: Part inserted despite vehicle FK failure!"
        );
        console.log("   ⚠️  Multi-table atomicity is BROKEN!");
      }
      console.log("");
      console.log("=".repeat(70));
      console.log("❌ TEST FAILED: Multi-table atomic rollback not working!");
      console.log("=".repeat(70));
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
