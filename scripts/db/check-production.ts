/**
 * Check Production Data - See what's currently in production tables
 * Run with: npx tsx scripts/check-production.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { supabase } from "../../src/lib/supabase/client";

async function checkProductionData() {
  console.log("🔍 Checking current production data...");
  
  try {
    // Count records in each table
    const { data: partsCount } = await supabase
      .from("parts")
      .select("count", { count: "exact", head: true });

    const { data: crossRefsCount } = await supabase
      .from("cross_references")
      .select("count", { count: "exact", head: true });

    const { data: applicationsCount } = await supabase
      .from("vehicle_applications")
      .select("count", { count: "exact", head: true });

    // Get sample data if any exists
    const { data: sampleParts } = await supabase
      .from("parts")
      .select("*")
      .limit(3);

    console.log("📊 Current production data:");
    console.log(`   Parts: ${partsCount?.[0]?.count || 0}`);
    console.log(`   Cross-references: ${crossRefsCount?.[0]?.count || 0}`);
    console.log(`   Vehicle applications: ${applicationsCount?.[0]?.count || 0}`);

    if (sampleParts && sampleParts.length > 0) {
      console.log("\n🔍 Sample parts in production:");
      sampleParts.forEach((part: any) => {
        console.log(`   - ${part.acr_sku}: ${part.part_type || "No type"}`);
      });
      console.log("\n⚠️  Production tables contain data. Consider clearing before import.");
    } else {
      console.log("\n✅ Production tables are empty - ready for bootstrap import");
    }

    const totalRecords = (partsCount?.[0]?.count || 0) + 
                        (crossRefsCount?.[0]?.count || 0) + 
                        (applicationsCount?.[0]?.count || 0);

    if (totalRecords > 0) {
      console.log(`\n🔄 To clear production data first, run:`);
      console.log(`   npx tsx scripts/clear-production.ts`);
    }

  } catch (error) {
    console.error("❌ Error checking production data:", error);
  }
}

if (require.main === module) {
  checkProductionData();
}

export { checkProductionData };