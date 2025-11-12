/**
 * Clear Production Data - Remove all data from production tables
 * Run with: npm run clear-prod (uses .env.production)
 *
 * WARNING: This will delete ALL production data!
 * Requires NODE_ENV=production to be set by npm script
 */

import dotenv from "dotenv";

// Load production environment
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production", override: true });
} else {
  console.error("❌ ERROR: This script must be run with NODE_ENV=production");
  console.error("   Use: npm run clear-prod");
  process.exit(1);
}

import { supabase } from "../../src/lib/supabase/client";

async function clearProductionData() {
  console.log("⚠️  WARNING: This will clear ALL production data!");
  console.log("🔄 Starting production data cleanup...");
  
  try {
    // Clear in proper order (foreign keys - children first)
    console.log("🧹 Clearing cross_references...");
    const { error: crossRefsError } = await supabase
      .from("cross_references")
      .delete()
      .gte('created_at', '1900-01-01');

    console.log("🧹 Clearing vehicle_applications...");
    const { error: vehicleAppsError } = await supabase
      .from("vehicle_applications")
      .delete()
      .gte('created_at', '1900-01-01');

    console.log("🧹 Clearing parts...");
    const { error: partsError } = await supabase
      .from("parts")
      .delete()
      .gte('created_at', '1900-01-01');

    // Report any errors
    if (crossRefsError) console.error("❌ Error clearing cross_references:", crossRefsError.message);
    if (vehicleAppsError) console.error("❌ Error clearing vehicle_applications:", vehicleAppsError.message);
    if (partsError) console.error("❌ Error clearing parts:", partsError.message);
    
    if (!crossRefsError && !vehicleAppsError && !partsError) {
      console.log("✅ Production tables cleared successfully");
      console.log("\n🚀 Ready for bootstrap import! Run:");
      console.log("   npx tsx scripts/bootstrap-import.ts");
    } else {
      console.log("❌ Some errors occurred during cleanup");
    }

  } catch (error) {
    console.error("❌ Error clearing production data:", error);
  }
}

async function confirmAndClear() {
  // For now, proceed directly - in a real scenario you might want user confirmation
  console.log("🔄 Proceeding with production data clear...\n");
  await clearProductionData();
}

if (require.main === module) {
  confirmAndClear();
}

export { clearProductionData };