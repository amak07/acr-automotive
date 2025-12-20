#!/usr/bin/env tsx
/**
 * Generate Baseline Export
 *
 * This script connects to the local Docker database (after seeding)
 * and exports all parts to a baseline Excel file for import pipeline testing.
 *
 * The baseline export is used by test-full-import-pipeline.ts to verify
 * that the import/export cycle works correctly.
 *
 * Prerequisites:
 * - Docker container must be running: npm run db:test:start
 * - Database must be seeded: npm run db:test:reset
 *
 * Usage:
 *   npm run test:generate-baseline
 */

import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { ExcelExportService } from "../../src/services/export/ExcelExportService";
import fs from "fs/promises";

// Load local Docker DB credentials
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function generateBaseline() {
  console.log("📊 Generating baseline export from local Docker database...");

  // Use DATABASE_URL from .env.local
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL not found in .env.local");
  }

  console.log(`🔌 Connecting to: ${databaseUrl.replace(/:[^:]*@/, ":****@")}`);

  // Create a mock Supabase client using the local Docker database
  // Note: We can't use Supabase client directly with DATABASE_URL
  // Instead, we'll use the ExcelExportService which uses Supabase client
  // We need to temporarily override the Supabase URL

  // For now, let's use the export service with the test environment
  // which should point to local Docker after db:test:reset

  const exportService = new ExcelExportService();

  console.log("📤 Exporting all parts to Excel...");

  try {
    // Export all parts from the database
    const excelBuffer = await exportService.exportAllData();

    // Create tmp directory if it doesn't exist
    const tmpDir = path.join(process.cwd(), "tmp");
    await fs.mkdir(tmpDir, { recursive: true });

    // Write the baseline export to tmp/ (where test-full-import-pipeline.ts expects it)
    const baselinePath = path.join(tmpDir, "baseline-export.xlsx");
    await fs.writeFile(baselinePath, Buffer.from(excelBuffer));

    console.log(`\n✅ Baseline export generated: ${baselinePath}`);

    // Get file stats for confirmation
    const stats = await fs.stat(baselinePath);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);

    console.log("\n📋 Next steps:");
    console.log("   1. Run npm test to verify all tests pass");
    console.log(
      "   2. Note: tmp/ is gitignored - regenerate after fresh clone"
    );
  } catch (error) {
    console.error("\n❌ Export failed:", error);
    throw error;
  }
}

// Run the generation
generateBaseline()
  .then(() => {
    console.log("\n✅ Baseline generation complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Baseline generation failed:", error);
    process.exit(1);
  });
