/**
 * Full Bootstrap Import Test - Tests complete Excel → Database workflow
 * Tests both PRECIOS and CATALOGACION import with test schema
 * Run with: npx tsx scripts/test-full-bootstrap.ts
 */

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import { PreciosParser } from "../src/lib/excel/precios-parser";
import { CatalogacionParser } from "../src/lib/excel/catalogacion-parser";
import { testImportPreciosData, testImportCatalogacionData } from "./test-import";
import * as fs from "fs";
import * as path from "path";
import { clearTestTables, testSupabase, verifyTestSchema } from "./test-client";

async function testFullBootstrapImport() {
  console.log("🧪 Starting Full Bootstrap Import Test (TEST SCHEMA)...\n");

  try {
    // Step 0: Verify test schema exists
    console.log("🔍 Verifying test schema...");
    const schemaExists = await verifyTestSchema();
    if (!schemaExists) {
      console.error(
        "❌ Test schema not set up. Please run test-schema.sql first."
      );
      return;
    }

    // Step 1: Clean existing test data first
    console.log("\n🧹 Cleaning existing test data...");
    await clearTestTables();

    // Step 2: Load PRECIOS Excel file
    console.log("\n📂 Loading PRECIOS Excel file...");
    const preciosPath = path.join(
      __dirname,
      "../src/lib/excel/__tests__/09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx"
    );

    if (!fs.existsSync(preciosPath)) {
      throw new Error(`PRECIOS Excel file not found: ${preciosPath}`);
    }

    const preciosBuffer = fs.readFileSync(preciosPath);
    console.log(`✅ Loaded PRECIOS file: ${preciosBuffer.length} bytes`);

    // Step 3: Parse PRECIOS Excel file
    console.log("\n📊 Parsing PRECIOS file...");
    const preciosResult = PreciosParser.parseFile(preciosBuffer);
    console.log(`✅ PRECIOS parsed: ${preciosResult.acrSkus.size} SKUs, ${preciosResult.crossReferences.length} cross-refs`);

    // Step 4: Import PRECIOS data to TEST database
    console.log("\n💾 Importing PRECIOS data to test database...");
    const preciosImportResult = await testImportPreciosData(preciosResult);
    console.log(`✅ PRECIOS imported: ${preciosImportResult.parts.length} parts, ${preciosImportResult.crossReferences.length} cross-refs`);

    // Step 5: Load CATALOGACION Excel file
    console.log("\n📂 Loading CATALOGACION Excel file...");
    const catalogacionPath = path.join(
      __dirname,
      "../src/lib/excel/__tests__/CATALOGACION ACR CLIENTES.xlsx"
    );

    if (!fs.existsSync(catalogacionPath)) {
      throw new Error(`CATALOGACION Excel file not found: ${catalogacionPath}`);
    }

    const catalogacionBuffer = fs.readFileSync(catalogacionPath);
    console.log(`✅ Loaded CATALOGACION file: ${catalogacionBuffer.length} bytes`);

    // Step 6: Parse CATALOGACION Excel file
    console.log("\n📊 Parsing CATALOGACION file...");
    const catalogacionResult = CatalogacionParser.parseFile(
      catalogacionBuffer,
      preciosResult.acrSkus
    );
    console.log(`✅ CATALOGACION parsed: ${catalogacionResult.parts.length} parts, ${catalogacionResult.applications.length} applications`);
    console.log(`⚠️  Orphaned SKUs: ${catalogacionResult.orphanedApplications.length}`);

    // Step 7: Import CATALOGACION data to TEST database
    console.log("\n💾 Importing CATALOGACION data to test database...");
    const catalogacionImportResult = await testImportCatalogacionData(
      catalogacionResult,
      preciosImportResult.parts
    );
    console.log(`✅ CATALOGACION imported: ${catalogacionImportResult.updatedParts} parts updated, ${catalogacionImportResult.insertedApplications} applications`);

    // Step 8: Verify final database state
    console.log("\n🔍 Verifying final database state...");
    await verifyFinalDatabaseState();

    console.log("\n🎉 Full Bootstrap Import Test completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Full Bootstrap Import Test failed:", error);
  }
}

async function verifyFinalDatabaseState() {
  // Count records in each table
  const { data: partsCount } = await testSupabase
    .from("parts")
    .select("count", { count: "exact", head: true });

  const { data: crossRefsCount } = await testSupabase
    .from("cross_references")
    .select("count", { count: "exact", head: true });

  const { data: applicationsCount } = await testSupabase
    .from("vehicle_applications")
    .select("count", { count: "exact", head: true });

  // Sample data verification
  const { data: samplePart } = await testSupabase
    .from("parts")
    .select("*")
    .limit(1)
    .single();

  const { data: sampleApplication } = await testSupabase
    .from("vehicle_applications")
    .select("*")
    .limit(1)
    .single();

  console.log(`✅ Final database verification:`);
  console.log(`   • Parts: ${partsCount?.[0]?.count || "unknown"}`);
  console.log(`   • Cross-references: ${crossRefsCount?.[0]?.count || "unknown"}`);
  console.log(`   • Vehicle applications: ${applicationsCount?.[0]?.count || "unknown"}`);
  
  if (samplePart) {
    console.log(`   • Sample part: ${samplePart.acr_sku} (${samplePart.part_type || 'no type'})`);
  }
  
  if (sampleApplication) {
    console.log(`   • Sample application: ${sampleApplication.make} ${sampleApplication.model} ${sampleApplication.year_range}`);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "test":
    case undefined:
      testFullBootstrapImport();
      break;
    case "cleanup":
    case "clear":
      console.log("🧹 Clearing Supabase test tables...");
      clearTestTables()
        .then(() => {
          console.log("✅ Test tables cleared successfully");
          process.exit(0);
        })
        .catch((err) => {
          console.error("❌ Error clearing tables:", err.message);
          process.exit(1);
        });
      break;
    default:
      console.log(`
Usage:
  npx tsx scripts/test-full-bootstrap.ts [command]

Commands:
  test      Run the full bootstrap import test (default)
  cleanup   Clear all data from test tables
  clear     Same as cleanup
  
Examples:
  npx tsx scripts/test-full-bootstrap.ts          # Run full test
  npx tsx scripts/test-full-bootstrap.ts test     # Run full test  
  npx tsx scripts/test-full-bootstrap.ts cleanup  # Clear test tables
      `);
      process.exit(0);
  }
}

export { testFullBootstrapImport };