/**
 * Export Excel from Test Database (Direct)
 *
 * Bypasses the Next.js API and exports directly from test database.
 * This ensures the export and import tests use the same database.
 *
 * Usage:
 *   npm run test:export-test
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { ExcelExportService } from "../../src/services/export/ExcelExportService";

// Load test environment
dotenv.config({ path: path.join(process.cwd(), ".env.test") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables in .env.test");
  console.error("   NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_DIR = path.join(process.cwd(), "tmp");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "test-export.xlsx");

async function exportFromTestDb() {
  console.log("📥 Exporting Excel from TEST database...\n");
  console.log(`📊 Database: ${supabaseUrl}\n`);

  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Fetch data from test database
    console.log("⏳ Fetching data from test database...");
    const start = Date.now();

    const [partsResult, vehiclesResult, crossRefsResult] = await Promise.all([
      supabase.from("parts").select("*").order("acr_sku"),
      supabase
        .from("vehicle_applications")
        .select("*, parts!inner(acr_sku)")
        .order("created_at"),
      supabase
        .from("cross_references")
        .select("*, parts!inner(acr_sku)")
        .order("created_at"),
    ]);

    if (partsResult.error) throw partsResult.error;
    if (vehiclesResult.error) throw vehiclesResult.error;
    if (crossRefsResult.error) throw crossRefsResult.error;

    const fetchDuration = Date.now() - start;

    console.log(`✅ Fetched in ${fetchDuration}ms`);
    console.log(`   Parts: ${partsResult.data.length}`);
    console.log(`   Vehicle Applications: ${vehiclesResult.data.length}`);
    console.log(`   Cross References: ${crossRefsResult.data.length}\n`);

    // Generate Excel file
    console.log("⏳ Generating Excel file...");
    const exportStart = Date.now();

    const exportService = new ExcelExportService();
    const buffer = await exportService.exportAllData();

    const exportDuration = Date.now() - exportStart;
    console.log(`✅ Generated in ${exportDuration}ms\n`);

    // Save to file
    console.log("💾 Saving to file...");
    fs.writeFileSync(OUTPUT_FILE, buffer);

    const fileStats = fs.statSync(OUTPUT_FILE);
    console.log(`✅ Saved to: ${OUTPUT_FILE}`);
    console.log(`   Size: ${Math.round(fileStats.size / 1024)} KB\n`);

    console.log("═".repeat(80));
    console.log("✅ EXPORT COMPLETE\n");
    console.log("📋 Summary:");
    console.log(`   Database: TEST (.env.test)`);
    console.log(`   Parts: ${partsResult.data.length}`);
    console.log(`   Vehicle Applications: ${vehiclesResult.data.length}`);
    console.log(`   Cross References: ${crossRefsResult.data.length}`);
    console.log(`   Total Records: ${partsResult.data.length + vehiclesResult.data.length + crossRefsResult.data.length}`);
    console.log(`   File: ${OUTPUT_FILE}`);
    console.log(`   ⏱️  Total Time: ${fetchDuration + exportDuration}ms\n`);
    console.log("💡 Now run: npm run test:full-pipeline");
    console.log("═".repeat(80));
  } catch (error: any) {
    console.error("\n❌ Export failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

exportFromTestDb();
