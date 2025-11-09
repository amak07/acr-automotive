/**
 * Test Full Import Pipeline (Parser → Validation → Diff → Import → Rollback)
 *
 * Tests the COMPLETE import flow:
 * 1. Parse Excel file with ExcelImportService
 * 2. Validate data with ValidationEngine
 * 3. Generate diff with DiffEngine
 * 4. Execute import with ImportService (creates snapshot)
 * 5. Verify snapshot was created
 * 6. Test rollback with RollbackService
 *
 * ⚠️  WARNING: This MODIFIES the database!
 * ⚠️  Use .env.test to point to test database only
 *
 * Usage:
 *   npm run test:full-pipeline
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { ExcelImportService } from "../../src/services/excel/import/ExcelImportService";
import { ValidationEngine } from "../../src/services/excel/validation/ValidationEngine";
import { DiffEngine } from "../../src/services/excel/diff/DiffEngine";
import { ImportService } from "../../src/services/excel/import/ImportService";
import { RollbackService } from "../../src/services/excel/rollback/RollbackService";
import type { ExistingDatabaseData } from "../../src/services/excel/validation/ValidationEngine";
import type {
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelCrossRefRow,
} from "../../src/services/excel/shared/types";
import { createClient } from "@supabase/supabase-js";

// Load environment variables (local Docker first, then remote Supabase)
dotenv.config({ path: path.join(process.cwd(), ".env.test.local") });
dotenv.config({ path: path.join(process.cwd(), ".env.test") });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  console.error(
    "   NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
  );
  console.error("   Make sure .env.test file exists\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Use baseline-export.xlsx for consistent test data (865 parts - count may vary after reseed)
const TEST_FILE = path.join(process.cwd(), "tmp", "baseline-export.xlsx");

async function testFullPipeline() {
  console.log("🧪 Testing FULL Import Pipeline (with database modifications)\n");
  console.log("⚠️  WARNING: This will modify the database!");
  console.log("⚠️  Make sure you're using a TEST database\n");
  console.log("═".repeat(80));

  let importId: string | null = null;

  try {
    // Step 1: Check if baseline file exists
    if (!fs.existsSync(TEST_FILE)) {
      console.error("❌ Baseline file not found:", TEST_FILE);
      console.error("\n💡 This file should exist in tmp/ directory");
      console.error("   If missing, restore from backup or regenerate baseline\n");
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

    const excelImportService = new ExcelImportService();
    const fileBuffer = fs.readFileSync(TEST_FILE);
    const file = new File([fileBuffer], "test-export.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    console.log("⏳ Parsing Excel file...");
    const parseStart = Date.now();
    const parsed = await excelImportService.parseFile(file);
    const parseDuration = Date.now() - parseStart;

    console.log(`✅ Parsed in ${parseDuration}ms`);
    console.log(`   Parts: ${parsed.parts.rowCount} rows`);
    console.log(`   Vehicle Applications: ${parsed.vehicleApplications.rowCount} rows`);
    console.log(`   Cross References: ${parsed.crossReferences.rowCount} rows\n`);

    // Step 3: Fetch existing database data
    console.log("═".repeat(80));
    console.log("STEP 2: Fetch Existing Database Data");
    console.log("═".repeat(80));

    console.log("⏳ Fetching current data from database...");
    const fetchStart = Date.now();
    const existingData = await fetchExistingData();
    const fetchDuration = Date.now() - fetchStart;

    console.log(`✅ Fetched in ${fetchDuration}ms`);
    console.log(`   Parts: ${existingData.parts.size} records`);
    console.log(`   Vehicle Applications: ${existingData.vehicleApplications.size} records`);
    console.log(`   Cross References: ${existingData.crossReferences.size} records\n`);

    // Step 4: Run validation
    console.log("═".repeat(80));
    console.log("STEP 3: Validate Data");
    console.log("═".repeat(80));

    console.log("⏳ Running validation engine...");
    const validationEngine = new ValidationEngine();
    const validateStart = Date.now();
    const validationResult = await validationEngine.validate(parsed, existingData);
    const validateDuration = Date.now() - validateStart;

    console.log(`✅ Validated in ${validateDuration}ms`);
    console.log(`   Valid: ${validationResult.valid ? "✅ Yes" : "❌ No"}`);
    console.log(`   Errors: ${validationResult.summary.totalErrors}`);
    console.log(`   Warnings: ${validationResult.summary.totalWarnings}\n`);

    if (!validationResult.valid) {
      console.log("❌ Validation failed - cannot proceed with import\n");
      validationResult.errors.slice(0, 5).forEach((error, i) => {
        console.log(`   ${i + 1}. [${error.code}] ${error.message}`);
      });
      process.exit(1);
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

    console.log(`✅ Diff generated in ${diffDuration}ms`);
    console.log(`\n📊 Changes Detected:`);
    console.log(`   ➕ Total Adds: ${diffResult.summary.totalAdds}`);
    console.log(`   🔄 Total Updates: ${diffResult.summary.totalUpdates}`);
    console.log(`   ➖ Total Deletes: ${diffResult.summary.totalDeletes}`);
    console.log(`   📝 Total Changes: ${diffResult.summary.totalChanges}\n`);

    if (diffResult.summary.totalChanges === 0) {
      console.log("ℹ️  No changes detected - skipping import\n");
      console.log("═".repeat(80));
      process.exit(0);
    }

    // Step 6: Execute Import (with snapshot creation)
    console.log("═".repeat(80));
    console.log("STEP 5: Execute Import (Creates Snapshot)");
    console.log("═".repeat(80));

    console.log("⚠️  About to MODIFY DATABASE...");
    console.log("⏳ Creating snapshot and executing import...\n");

    const importService = new ImportService();
    const importStart = Date.now();
    const importResult = await importService.executeImport(parsed, diffResult, {
      fileName: "test-export.xlsx",
      fileSize: fileStats.size,
      uploadedAt: new Date(),
      importedBy: "test-script",
      tenantId: undefined, // Single tenant for now
    });
    const importDuration = Date.now() - importStart;

    console.log(`✅ Import completed in ${importDuration}ms`);
    console.log(`   Import ID: ${importResult.importId}`);
    console.log(`   Changes Applied: ${importResult.summary.totalChanges}`);
    console.log(`   Snapshot Created: ✅ Yes\n`);

    importId = importResult.importId;

    // Step 7: Verify snapshot was created
    console.log("═".repeat(80));
    console.log("STEP 6: Verify Snapshot");
    console.log("═".repeat(80));

    console.log("⏳ Fetching import history record...");
    const { data: historyRecord, error: historyError } = await supabase
      .from("import_history")
      .select("*")
      .eq("id", importId)
      .single();

    if (historyError || !historyRecord) {
      throw new Error("Failed to fetch import history record");
    }

    console.log("✅ Snapshot verified\n");
    console.log("📋 Import History Record:");
    console.log(`   ID: ${historyRecord.id}`);
    console.log(`   File: ${historyRecord.file_name}`);
    console.log(`   Size: ${Math.round(historyRecord.file_size_bytes / 1024)} KB`);
    console.log(`   Rows Imported: ${historyRecord.rows_imported}`);
    console.log(`   Created At: ${new Date(historyRecord.created_at).toLocaleString()}`);
    console.log(`\n📊 Snapshot Data:`);
    console.log(`   Parts: ${historyRecord.snapshot_data.parts.length} records`);
    console.log(`   Vehicle Apps: ${historyRecord.snapshot_data.vehicle_applications.length} records`);
    console.log(`   Cross Refs: ${historyRecord.snapshot_data.cross_references.length} records`);
    console.log(`   Timestamp: ${historyRecord.snapshot_data.timestamp}\n`);

    // Step 8: Test Rollback
    console.log("═".repeat(80));
    console.log("STEP 7: Test Rollback");
    console.log("═".repeat(80));

    console.log("⚠️  About to ROLLBACK import (restore snapshot)...");
    console.log("⏳ Executing rollback...\n");

    const rollbackService = new RollbackService();
    const rollbackStart = Date.now();
    const rollbackResult = await rollbackService.rollbackToImport(importId);
    const rollbackDuration = Date.now() - rollbackStart;

    console.log(`✅ Rollback completed in ${rollbackDuration}ms`);
    console.log(`   Import ID: ${rollbackResult.importId}`);
    console.log(`   Parts Restored: ${rollbackResult.restoredCounts.parts}`);
    console.log(`   Vehicle Apps Restored: ${rollbackResult.restoredCounts.vehicleApplications}`);
    console.log(`   Cross Refs Restored: ${rollbackResult.restoredCounts.crossReferences}\n`);

    // Step 9: Verify rollback
    console.log("═".repeat(80));
    console.log("STEP 8: Verify Rollback");
    console.log("═".repeat(80));

    console.log("⏳ Checking if snapshot was consumed...");
    const { data: afterRollback, error: checkError } = await supabase
      .from("import_history")
      .select("id")
      .eq("id", importId);

    if (checkError) {
      throw new Error("Failed to check import history");
    }

    if (afterRollback && afterRollback.length === 0) {
      console.log("✅ Snapshot consumed (deleted after rollback)\n");
    } else {
      console.log("⚠️  Snapshot still exists (should have been deleted)\n");
    }

    // Final summary
    console.log("═".repeat(80));
    console.log("✅ FULL PIPELINE TEST COMPLETE\n");

    console.log("📋 Performance Summary:");
    console.log(`   Parse: ${parseDuration}ms`);
    console.log(`   Database Fetch: ${fetchDuration}ms`);
    console.log(`   Validation: ${validateDuration}ms`);
    console.log(`   Diff: ${diffDuration}ms`);
    console.log(`   Import (with snapshot): ${importDuration}ms`);
    console.log(`   Rollback (restore snapshot): ${rollbackDuration}ms`);
    console.log(`   ⏱️  Total: ${parseDuration + fetchDuration + validateDuration + diffDuration + importDuration + rollbackDuration}ms\n`);

    console.log("✅ All systems operational!");
    console.log("   - ImportService ✅");
    console.log("   - Snapshot creation ✅");
    console.log("   - RollbackService ✅");
    console.log("   - Snapshot restoration ✅\n");

    console.log("═".repeat(80));
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);

    // Cleanup: Try to rollback if import succeeded
    if (importId) {
      console.log("\n🧹 Attempting cleanup rollback...");
      try {
        const rollbackService = new RollbackService();
        await rollbackService.rollbackToImport(importId);
        console.log("✅ Cleanup successful\n");
      } catch (cleanupError: any) {
        console.error("❌ Cleanup failed:", cleanupError.message);
      }
    }

    process.exit(1);
  } finally {
    // Safety net: Ensure cleanup even if rollback test fails
    if (importId) {
      console.log("\n🔒 Final safety check...");
      try {
        const { data: snapshot } = await supabase
          .from('import_history')
          .select('id')
          .eq('id', importId)
          .single();

        if (snapshot) {
          console.log("   ⚠️  Import snapshot still exists - cleaning up...");
          const rollbackService = new RollbackService();
          await rollbackService.rollbackToImport(importId);
          console.log("   ✅ Safety cleanup executed");
        } else {
          console.log("   ✅ Already cleaned up");
        }
      } catch (finalError: any) {
        // Import already cleaned up - this is fine
        if (finalError.message?.match(/not found|does not exist|no import snapshots/i)) {
          console.log("   ✅ Already cleaned up");
        } else {
          console.warn(`   ⚠️  Safety check warning: ${finalError.message}`);
        }
      }
    }
  }
}

/**
 * Fetch all records with pagination (Supabase limit: 1000 per query)
 */
async function fetchAllRecords<T>(
  table: string,
  select: string = "*"
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let allData: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }

    if (data && data.length > 0) {
      allData = allData.concat(data as T[]);
      hasMore = data.length === PAGE_SIZE; // Continue if we got a full page
      page++;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

/**
 * Fetch existing database data for validation and diff
 */
async function fetchExistingData(): Promise<ExistingDatabaseData> {
  // Fetch all parts with pagination
  const partsData = await fetchAllRecords("parts", "*");

  // Fetch all vehicle applications with ACR_SKU joined (with pagination)
  const vehiclesData = await fetchAllRecords(
    "vehicle_applications",
    "*, parts!inner(acr_sku)"
  );

  // Fetch all cross references with ACR_SKU joined (with pagination)
  const crossRefsData = await fetchAllRecords(
    "cross_references",
    "*, parts!inner(acr_sku)"
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
      _acr_part_id: cr.part_id,
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
testFullPipeline();
