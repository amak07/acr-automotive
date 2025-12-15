/**
 * Verify Migration 008 - Check if execute_atomic_import function exists
 *
 * Uses staging database (.env.staging)
 */

import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load staging environment variables (remote TEST database)
dotenv.config({ path: path.join(process.cwd(), ".env.staging") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  console.error(
    "   NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
  );
  console.error("   Make sure .env.staging file exists\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration008() {
  console.log("🔍 Checking if migration 008 was applied...\n");

  try {
    // Try to call the function with empty parameters
    const { data, error } = await supabase.rpc("execute_atomic_import", {
      parts_to_add: [],
      parts_to_update: [],
      vehicles_to_add: [],
      vehicles_to_update: [],
      cross_refs_to_add: [],
      cross_refs_to_update: [],
      tenant_id_filter: null,
    });

    if (error) {
      if (error.message.includes("Could not find the function")) {
        console.log("❌ Migration 008 NOT applied");
        console.log("");
        console.log("The execute_atomic_import() function does not exist.");
        console.log("");
        console.log("To apply migration 008:");
        console.log("1. Go to Supabase Dashboard → SQL Editor");
        console.log(
          "2. Open: src/lib/supabase/migrations/008_add_atomic_import_transaction.sql"
        );
        console.log("3. Copy and paste the entire SQL file");
        console.log('4. Click "Run"');
        console.log("5. Verify success message appears");
        console.log("");
        process.exit(1);
      } else {
        throw error;
      }
    }

    console.log("✅ Migration 008 is applied!");
    console.log("");
    console.log("Function execute_atomic_import() exists and is callable.");
    console.log("Result:", data);
    console.log("");
    process.exit(0);
  } catch (error) {
    console.error("Error checking migration:", error);
    process.exit(1);
  }
}

verifyMigration008();
