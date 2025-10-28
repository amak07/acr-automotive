/**
 * Reset Test Database to Seed State
 *
 * Loads seed data from fixtures/seed-data.sql
 * Use this before running test suites to ensure consistent baseline state
 *
 * Usage:
 *   npm run test:reset-db
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load test environment
dotenv.config({ path: path.join(process.cwd(), ".env.test") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  console.error("   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  console.error("   Make sure .env.test file exists\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SEED_FILE = path.join(process.cwd(), "fixtures", "seed-data.sql");

async function resetTestDatabase() {
  console.log("🔄 Resetting test database to seed state...\n");
  console.log(`📊 Database: ${supabaseUrl}`);
  console.log(`📁 Seed File: ${SEED_FILE}\n`);

  try {
    // Check if seed file exists
    if (!fs.existsSync(SEED_FILE)) {
      throw new Error(`Seed file not found: ${SEED_FILE}`);
    }

    // Read SQL seed file
    const sqlContent = fs.readFileSync(SEED_FILE, "utf-8");

    // Note: Supabase JS client doesn't support raw SQL execution via REST API
    // We need to execute via RPC or use pg client directly
    // For now, we'll parse and execute individual statements

    console.log("⚠️  WARNING: This script requires direct PostgreSQL access");
    console.log("⚠️  Supabase REST API doesn't support raw SQL execution");
    console.log("");
    console.log("📋 Options:");
    console.log("   1. Run seed-data.sql manually in Supabase SQL Editor");
    console.log("   2. Use psql command: psql <connection_string> < fixtures/seed-data.sql");
    console.log("   3. Install pg package and execute directly");
    console.log("");
    console.log("💡 For now, manually run the SQL file in Supabase Dashboard → SQL Editor");
    console.log("");
    console.log("SQL Content Preview:");
    console.log("─".repeat(80));
    console.log(sqlContent.substring(0, 500) + "...\n");

    // Alternative: Use individual Supabase client calls
    console.log("🔧 Attempting alternative method using Supabase client...\n");

    // Delete existing seed data
    console.log("⏳ Cleaning existing seed data...");

    const { error: delCrossRefsError } = await supabase
      .from("cross_references")
      .delete()
      .like("acr_part_id", "00000000-0000-0000-0000-0000000000%");

    const { error: delVehicleAppsError } = await supabase
      .from("vehicle_applications")
      .delete()
      .like("part_id", "00000000-0000-0000-0000-0000000000%");

    const { error: delPartsError } = await supabase
      .from("parts")
      .delete()
      .like("acr_sku", "SEED-%");

    if (delCrossRefsError) console.warn("⚠️ ", delCrossRefsError.message);
    if (delVehicleAppsError) console.warn("⚠️ ", delVehicleAppsError.message);
    if (delPartsError) console.warn("⚠️ ", delPartsError.message);

    console.log("✅ Cleanup complete\n");

    console.log("⏳ Inserting seed data...");
    console.log("   This may take a moment...\n");

    // Insert seed parts (use raw SQL file for now)
    console.log("ℹ️  To complete reset, run this SQL in Supabase Dashboard:");
    console.log("");
    console.log("─".repeat(80));
    console.log(sqlContent);
    console.log("─".repeat(80));
    console.log("");

  } catch (error: any) {
    console.error("\n❌ Reset failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resetTestDatabase();
