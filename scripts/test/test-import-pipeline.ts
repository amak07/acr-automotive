/**
 * Test Import Pipeline (Parser → Validation → Diff)
 *
 * Tests the first 3 steps of the import flow:
 * 1. Parse Excel file with ExcelImportService
 * 2. Validate data with ValidationEngine
 * 3. Generate diff with DiffEngine
 *
 * Does NOT modify the database - read-only testing
 *
 * Usage:
 *   npm run test:import-pipeline
 */

// IMPORTANT: Load test environment variables BEFORE any other imports
// tsx (TypeScript executor) doesn't automatically load .env files
import dotenv from "dotenv";
import * as path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env.local"),
  override: true,
});

import * as fs from "fs";
import { verifyTestEnvironment } from "../../tests/setup/env";
import { ExcelImportService } from "../../src/services/excel/import/ExcelImportService";
import { ValidationEngine } from "../../src/services/excel/validation/ValidationEngine";
import { DiffEngine } from "../../src/services/excel/diff/DiffEngine";
import type { ExistingDatabaseData } from "../../src/services/excel/validation/ValidationEngine";
import type {
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelCrossRefRow,
} from "../../src/services/excel/shared/types";
import { createClient } from "@supabase/supabase-js";

// Verify test environment is configured correctly
verifyTestEnvironment();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  console.error(
    "   NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
  );
  console.error("   Make sure .env.local file exists\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_FILE = path.join(process.cwd(), "tmp", "test-export.xlsx");

async function testImportPipeline() {
  console.log("🧪 Testing Import Pipeline\n");
  console.log("═".repeat(80));

  try {
    // Step 1: Check if test file exists
    if (!fs.existsSync(TEST_FILE)) {
      console.error("❌ Test file not found:", TEST_FILE);
      console.error("\n💡 Run this first to generate test file:");
      console.error("   npm run test:export\n");
      process.exit(1);
    }

    const fileStats = fs.statSync(TEST_FILE);
    console.log(`📁 Test File: ${TEST_FILE}`);
    console.log(`   Size: ${Math.round(fileStats.size / 1024)} KB`);
    console.log(`   Modified: ${fileStats.mtime.toLocaleString()}\n`);

    // Step 2: Parse Excel file
    console.log("═".repeat(80));
    console.log("STEP 1: Parse Excel File");
    console.log("═".repeat(80));

    const importService = new ExcelImportService();

    // Read file as File object (simulate browser upload)
    const fileBuffer = fs.readFileSync(TEST_FILE);
    const file = new File([fileBuffer], "test-export.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Validate file format
    console.log("⏳ Validating file format...");
    importService.validateFileFormat(file);
    console.log("✅ File format valid\n");

    // Parse file
    console.log("⏳ Parsing Excel file...");
    const parseStart = Date.now();
    const parsed = await importService.parseFile(file);
    const parseDuration = Date.now() - parseStart;

    console.log(`✅ Parsed in ${parseDuration}ms\n`);
    console.log("📊 Parse Results:");
    console.log(`   Parts: ${parsed.parts.rowCount} rows`);
    console.log(
      `   Vehicle Applications: ${parsed.vehicleApplications.rowCount} rows`
    );
    console.log(`   Cross References: ${parsed.crossReferences.rowCount} rows`);
    console.log(
      `   Has Hidden IDs: ${parsed.parts.hasHiddenIds ? "✅ Yes" : "❌ No"}`
    );
    console.log(
      `   Is Exported File: ${importService.isExportedFile(parsed) ? "✅ Yes" : "❌ No"}\n`
    );

    // Show sample data
    console.log("📋 Sample Data (first 3 rows from each sheet):\n");

    console.log("Parts:");
    parsed.parts.data.slice(0, 3).forEach((part, i) => {
      console.log(`  ${i + 1}. ${part.acr_sku} - ${part.part_type}`);
    });

    console.log("\nVehicle Applications:");
    parsed.vehicleApplications.data.slice(0, 3).forEach((va, i) => {
      console.log(
        `  ${i + 1}. ${va.acr_sku} - ${va.make} ${va.model} (${va.start_year}-${va.end_year})`
      );
    });

    console.log("\nCross References:");
    parsed.crossReferences.data.slice(0, 3).forEach((cr, i) => {
      console.log(
        `  ${i + 1}. ${cr.acr_sku} → ${cr.competitor_brand || "(no brand)"} ${cr.competitor_sku}`
      );
    });

    // Step 3: Fetch existing database data
    console.log("\n═".repeat(80));
    console.log("STEP 2: Fetch Existing Database Data");
    console.log("═".repeat(80));

    console.log("⏳ Fetching current data from database...");
    const fetchStart = Date.now();
    const existingData = await fetchExistingData();
    const fetchDuration = Date.now() - fetchStart;

    console.log(`✅ Fetched in ${fetchDuration}ms\n`);
    console.log("📊 Database Stats:");
    console.log(`   Parts: ${existingData.parts.size} records`);
    console.log(
      `   Vehicle Applications: ${existingData.vehicleApplications.size} records`
    );
    console.log(
      `   Cross References: ${existingData.crossReferences.size} records`
    );
    console.log(`   Unique SKUs: ${existingData.partSkus.size}\n`);

    // Step 4: Run validation
    console.log("═".repeat(80));
    console.log("STEP 3: Validate Data");
    console.log("═".repeat(80));

    console.log("⏳ Running validation engine...");
    const validationEngine = new ValidationEngine();
    const validateStart = Date.now();
    const validationResult = await validationEngine.validate(
      parsed,
      existingData
    );
    const validateDuration = Date.now() - validateStart;

    console.log(`✅ Validated in ${validateDuration}ms\n`);

    // Display validation results
    console.log("📊 Validation Results:");
    console.log(
      `   Valid: ${validationResult.valid ? "✅ Yes" : "❌ No (has errors)"}`
    );
    console.log(`   Errors: ${validationResult.summary.totalErrors}`);
    console.log(`   Warnings: ${validationResult.summary.totalWarnings}\n`);

    if (validationResult.errors.length > 0) {
      console.log("❌ Errors Found:");
      validationResult.errors.slice(0, 10).forEach((error, i) => {
        console.log(`   ${i + 1}. [${error.code}] ${error.message}`);
        if (error.sheet && error.row) {
          console.log(
            `      Location: ${error.sheet}, Row ${error.row}${error.column ? `, Column ${error.column}` : ""}`
          );
        }
      });
      if (validationResult.errors.length > 10) {
        console.log(
          `   ... and ${validationResult.errors.length - 10} more errors\n`
        );
      }
    }

    if (validationResult.warnings.length > 0) {
      console.log("\n⚠️  Warnings Found:");
      validationResult.warnings.slice(0, 10).forEach((warning, i) => {
        console.log(`   ${i + 1}. [${warning.code}] ${warning.message}`);
        if (warning.sheet && warning.row) {
          console.log(
            `      Location: ${warning.sheet}, Row ${warning.row}${warning.column ? `, Column ${warning.column}` : ""}`
          );
        }
      });
      if (validationResult.warnings.length > 10) {
        console.log(
          `   ... and ${validationResult.warnings.length - 10} more warnings\n`
        );
      }
    }

    if (
      validationResult.errors.length === 0 &&
      validationResult.warnings.length === 0
    ) {
      console.log("   ✅ No errors or warnings found!\n");
    }

    // Step 5: Generate diff
    console.log("═".repeat(80));
    console.log("STEP 4: Generate Diff (Change Detection)");
    console.log("═".repeat(80));

    console.log("⏳ Running diff engine...");
    const diffEngine = new DiffEngine();
    const diffStart = Date.now();
    const diffResult = diffEngine.generateDiff(parsed, existingData);
    const diffDuration = Date.now() - diffStart;

    console.log(`✅ Diff generated in ${diffDuration}ms\n`);

    // Display diff results
    console.log("📊 Diff Results (Changes Detected):\n");

    console.log(`Parts:`);
    console.log(`   ➕ Adds: ${diffResult.parts.summary.totalAdds}`);
    console.log(`   🔄 Updates: ${diffResult.parts.summary.totalUpdates}`);
    console.log(`   ➖ Deletes: ${diffResult.parts.summary.totalDeletes}`);
    console.log(`   ✓ Unchanged: ${diffResult.parts.summary.totalUnchanged}`);

    console.log(`\nVehicle Applications:`);
    console.log(
      `   ➕ Adds: ${diffResult.vehicleApplications.summary.totalAdds}`
    );
    console.log(
      `   🔄 Updates: ${diffResult.vehicleApplications.summary.totalUpdates}`
    );
    console.log(
      `   ➖ Deletes: ${diffResult.vehicleApplications.summary.totalDeletes}`
    );
    console.log(
      `   ✓ Unchanged: ${diffResult.vehicleApplications.summary.totalUnchanged}`
    );

    console.log(`\nCross References:`);
    console.log(`   ➕ Adds: ${diffResult.crossReferences.summary.totalAdds}`);
    console.log(
      `   🔄 Updates: ${diffResult.crossReferences.summary.totalUpdates}`
    );
    console.log(
      `   ➖ Deletes: ${diffResult.crossReferences.summary.totalDeletes}`
    );
    console.log(
      `   ✓ Unchanged: ${diffResult.crossReferences.summary.totalUnchanged}`
    );

    console.log(`\nOverall Summary:`);
    console.log(`   📝 Total Changes: ${diffResult.summary.totalChanges}`);
    console.log(`   ➕ Total Adds: ${diffResult.summary.totalAdds}`);
    console.log(`   🔄 Total Updates: ${diffResult.summary.totalUpdates}`);
    console.log(`   ➖ Total Deletes: ${diffResult.summary.totalDeletes}`);
    console.log(`   ✓ Total Unchanged: ${diffResult.summary.totalUnchanged}\n`);

    // Show sample changes
    if (diffResult.parts.updates.length > 0) {
      console.log("🔍 Sample Updates (Parts):");
      diffResult.parts.updates.slice(0, 3).forEach((update, i) => {
        console.log(`   ${i + 1}. ${update.after?.acr_sku}`);
        console.log(`      Changed fields: ${update.changes?.join(", ")}`);
      });
      console.log("");
    }

    if (diffResult.parts.adds.length > 0) {
      console.log("🔍 Sample Adds (Parts):");
      diffResult.parts.adds.slice(0, 3).forEach((add, i) => {
        console.log(
          `   ${i + 1}. ${add.after?.acr_sku} - ${add.after?.part_type}`
        );
      });
      console.log("");
    }

    if (diffResult.parts.deletes.length > 0) {
      console.log("🔍 Sample Deletes (Parts):");
      diffResult.parts.deletes.slice(0, 3).forEach((del, i) => {
        console.log(
          `   ${i + 1}. ${del.before?.acr_sku} - ${del.before?.part_type}`
        );
      });
      console.log("");
    }

    // Final summary
    console.log("═".repeat(80));
    console.log("✅ TEST COMPLETE\n");

    console.log("📋 Summary:");
    console.log(`   ✅ Parse: ${parseDuration}ms`);
    console.log(`   ✅ Database Fetch: ${fetchDuration}ms`);
    console.log(
      `   ✅ Validation: ${validateDuration}ms (${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings)`
    );
    console.log(
      `   ✅ Diff: ${diffDuration}ms (${diffResult.summary.totalChanges} changes detected)`
    );
    console.log(
      `   ⏱️  Total: ${parseDuration + fetchDuration + validateDuration + diffDuration}ms\n`
    );

    if (!validationResult.valid) {
      console.log("⚠️  Import would be BLOCKED due to validation errors\n");
      process.exit(1);
    } else if (validationResult.warnings.length > 0) {
      console.log("⚠️  Import would show warnings for user confirmation\n");
    } else if (diffResult.summary.totalChanges === 0) {
      console.log("ℹ️  No changes detected - file matches database\n");
    } else {
      console.log("✅ Import would proceed with changes shown above\n");
    }

    console.log("═".repeat(80));
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Fetch existing database data for validation and diff
 */
async function fetchExistingData(): Promise<ExistingDatabaseData> {
  // Fetch all parts
  const { data: partsData, error: partsError } = await supabase
    .from("parts")
    .select("*");

  if (partsError)
    throw new Error(`Failed to fetch parts: ${partsError.message}`);

  // Fetch all vehicle applications with ACR_SKU joined
  const { data: vehiclesData, error: vehiclesError } = await supabase
    .from("vehicle_applications")
    .select("*, parts!inner(acr_sku)");

  if (vehiclesError)
    throw new Error(
      `Failed to fetch vehicle applications: ${vehiclesError.message}`
    );

  // Fetch all cross references with ACR_SKU joined
  const { data: crossRefsData, error: crossRefsError } = await supabase
    .from("cross_references")
    .select("*, parts!inner(acr_sku)");

  if (crossRefsError)
    throw new Error(
      `Failed to fetch cross references: ${crossRefsError.message}`
    );

  // Build maps
  const parts = new Map<string, ExcelPartRow>();
  const partSkus = new Set<string>();

  partsData?.forEach((part: any) => {
    parts.set(part.id, {
      _id: part.id,
      acr_sku: part.acr_sku,
      part_type: part.part_type,
      position_type: part.position_type,
      abs_type: part.abs_type,
      bolt_pattern: part.bolt_pattern,
      drive_type: part.drive_type,
      specifications: part.specifications,
    });
    partSkus.add(part.acr_sku);
  });

  const vehicleApplications = new Map<string, ExcelVehicleAppRow>();
  vehiclesData?.forEach((va: any) => {
    vehicleApplications.set(va.id, {
      _id: va.id,
      _part_id: va.part_id,
      acr_sku: va.parts?.acr_sku || "",
      make: va.make,
      model: va.model,
      start_year: va.start_year,
      end_year: va.end_year,
    });
  });

  const crossReferences = new Map<string, ExcelCrossRefRow>();
  crossRefsData?.forEach((cr: any) => {
    crossReferences.set(cr.id, {
      _id: cr.id,
      _acr_part_id: cr.acr_part_id,
      acr_sku: cr.parts?.acr_sku || "",
      competitor_brand: cr.competitor_brand,
      competitor_sku: cr.competitor_sku,
    });
  });

  return {
    parts,
    vehicleApplications,
    crossReferences,
    partSkus,
  };
}

// Run test
testImportPipeline();
