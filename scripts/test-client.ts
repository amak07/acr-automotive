/**
 * Test Supabase Client - Uses test schema instead of public schema
 * Safe for testing without affecting production data
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Test Supabase Client
 * Points to test schema tables instead of public schema
 */
export const testSupabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'test' // Use test schema instead of public
  }
});

/**
 * Helper function to clear all test tables
 * Safe to use - only affects test schema
 */
export async function clearTestTables() {
  console.log("🧹 Clearing test schema tables...");
  
  // Clear in proper order (foreign keys)
  const { error: crossRefsError } = await testSupabase
    .from("cross_references")
    .delete()
    .gte('created_at', '1900-01-01');

  const { error: vehicleAppsError } = await testSupabase
    .from("vehicle_applications")
    .delete()
    .gte('created_at', '1900-01-01');

  const { error: partsError } = await testSupabase
    .from("parts")
    .delete()
    .gte('created_at', '1900-01-01');

  if (crossRefsError) console.error("❌ Error cleaning test cross_references:", crossRefsError.message);
  if (vehicleAppsError) console.error("❌ Error cleaning test vehicle_applications:", vehicleAppsError.message);
  if (partsError) console.error("❌ Error cleaning test parts:", partsError.message);
  
  if (!crossRefsError && !vehicleAppsError && !partsError) {
    console.log("✅ Test tables cleared successfully");
  }
}

/**
 * Helper function to verify test schema tables exist
 */
export async function verifyTestSchema() {
  try {
    const { error } = await testSupabase.from("parts").select("id").limit(1);
    
    if (error) {
      console.error("❌ Test schema not accessible. Please run test-schema.sql in Supabase SQL Editor.");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error verifying test schema:", error);
    return false;
  }
}