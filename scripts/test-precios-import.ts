/**
 * Standalone Test Script for PRECIOS Import Pipeline
 * Run with: npx tsx scripts/test-precios-import.ts
 */

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import { PreciosParser } from "../src/lib/excel/precios-parser";
import * as fs from "fs";
import * as path from "path";
import { clearTestTables, testSupabase, verifyTestSchema } from "./test-client";
import { testImportPreciosData } from "./test-import";

async function testPreciosImportPipeline() {
  console.log("🧪 Starting PRECIOS Import Pipeline Test (TEST SCHEMA)...\n");

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
    // Step 1: Load real Excel file
    console.log("📂 Loading Excel file...");
    const excelPath = path.join(
      __dirname,
      "../src/lib/excel/__tests__/09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx"
    );

    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found: ${excelPath}`);
    }

    const excelBuffer = fs.readFileSync(excelPath);
    console.log(`✅ Loaded Excel file: ${excelBuffer.length} bytes`);

    // Step 2: Parse Excel file
    console.log("\n📊 Parsing Excel file...");
    const preciosResult = PreciosParser.parseFile(excelBuffer);

    if (!preciosResult.success || !preciosResult.data) {
      console.error("❌ Excel parsing failed:", preciosResult.conflicts);
      return;
    }

    const { acrSkus, crossReferences, summary } = preciosResult.data;
    console.log(`✅ Parsed successfully:`);
    console.log(`   • ${acrSkus.size} unique ACR SKUs`);
    console.log(`   • ${crossReferences.length} cross-references`);
    console.log(`   • Processing time: ${summary.processingTimeMs}ms`);

    // Step 3: Clean existing test data first
    console.log("\n🧹 Cleaning existing test data...");
    await clearTestTables();

    // Step 4: Import to TEST database
    console.log("\n💾 Importing to TEST database...");
    const startTime = Date.now();

    const importResult = await testImportPreciosData(preciosResult.data);

    const importTime = Date.now() - startTime;
    console.log(`✅ Import completed in ${importTime}ms:`);
    console.log(`   • ${importResult.parts.length} parts inserted`);
    console.log(
      `   • ${importResult.crossReferences.length} cross-references inserted`
    );

    // Step 4: Verify database data
    console.log("\n🔍 Verifying database data...");
    await verifyTestDatabaseData(importResult);

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }
}

async function verifyTestDatabaseData(importResult: any) {
  const { data: partsCount } = await testSupabase
    .from("parts")
    .select("count", { count: "exact", head: true });

  const { data: crossRefsCount } = await testSupabase
    .from("cross_references")
    .select("count", { count: "exact", head: true });

  console.log(`✅ Database verification:`);
  console.log(`   • Parts: ${partsCount?.[0]?.count || "unknown"}`);
  console.log(
    `   • Cross-references: ${crossRefsCount?.[0]?.count || "unknown"}`
  );
}

// Cleanup function - now uses clearTestTables from test-client
async function cleanupTestData() {
  await clearTestTables();
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "test":
    case undefined:
      testPreciosImportPipeline();
      break;
    case "cleanup":
    case "clear":
      console.log("🧹 Clearing Supabase tables...");
      cleanupTestData()
        .then(() => {
          console.log("✅ Tables cleared successfully");
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
  npx tsx scripts/test-precios-import.ts [command]

Commands:
  test      Run the full import pipeline test (default)
  cleanup   Clear all data from parts and cross_references tables
  clear     Same as cleanup
  
Examples:
  npx tsx scripts/test-precios-import.ts          # Run test
  npx tsx scripts/test-precios-import.ts test     # Run test  
  npx tsx scripts/test-precios-import.ts cleanup  # Clear tables
      `);
      process.exit(0);
  }
}

export { testPreciosImportPipeline, cleanupTestData };
