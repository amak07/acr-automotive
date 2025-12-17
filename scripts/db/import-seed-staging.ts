#!/usr/bin/env tsx
/**
 * Import Seed Data to Staging Database
 *
 * This script imports tests/fixtures/seed-data.sql into the remote staging Supabase database.
 * Uses Supabase REST API since remote databases don't expose PostgreSQL port directly.
 *
 * Usage:
 *   npm run staging:import-seed
 *
 * Requires NODE_ENV=staging to be set by npm script
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";
import { createClient } from "@supabase/supabase-js";

// Load staging environment
if (process.env.NODE_ENV === ("staging" as string)) {
  dotenv.config({
    path: path.join(process.cwd(), ".env.staging"),
    override: true,
  });
} else {
  console.error("❌ ERROR: This script must be run with NODE_ENV=staging");
  console.error("   Use: npm run staging:import-seed");
  process.exit(1);
}

// Safety check - verify we're using the TEST Supabase project
const TEST_PROJECT_ID = "fzsdaqpwwbuwkvbzyiax"; // acr-automotive-test project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl?.includes(TEST_PROJECT_ID)) {
  console.error("\n❌ SAFETY CHECK FAILED!");
  console.error("   This is NOT the test database project!");
  console.error(`   Current URL: ${supabaseUrl}`);
  console.error(`   Expected project ID: ${TEST_PROJECT_ID}`);
  console.error("\n   Aborting to prevent production data loss!\n");
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.staging");
  process.exit(1);
}

interface ParsedPart {
  id: string;
  acr_sku: string;
  part_type: string;
  position_type: string | null;
  abs_type: string | null;
  bolt_pattern: string | null;
  drive_type: string | null;
  specifications: string | null;
}

interface ParsedVehicle {
  id: string;
  part_id: string;
  make: string;
  model: string;
  start_year: number;
  end_year: number;
}

interface ParsedCrossRef {
  id: string;
  acr_part_id: string;
  competitor_sku: string;
  competitor_brand: string | null;
}

/**
 * Parse SQL INSERT statements to extract values
 * Handles multi-line VALUES with rows like:
 *   ('uuid', 'sku', 'type', ...),
 *   ('uuid', 'sku', 'type', ...);
 */
function parseSqlValues(
  sqlContent: string,
  tableName: string
): Record<string, unknown>[] {
  // Find the INSERT statement for this table - look for the section marker first
  // Handle both "parts" -> "PARTS" and "vehicle_applications" -> "VEHICLE APPLICATIONS"
  const sectionMarker = tableName.toUpperCase().replace(/_/g, " ");
  const sectionStart = sqlContent.indexOf(`-- ${sectionMarker}`);

  if (sectionStart === -1) {
    console.log(`   No section marker found for ${tableName}`);
    return [];
  }

  // Get content from section marker to the next section or end
  const afterSection = sqlContent.slice(sectionStart);
  const nextSectionMatch = afterSection.slice(100).match(/\n-- =+\n-- [A-Z]/);
  const sectionEnd = nextSectionMatch
    ? sectionStart + 100 + nextSectionMatch.index!
    : sqlContent.length;

  const sectionContent = sqlContent.slice(sectionStart, sectionEnd);

  // Find INSERT statement in this section
  const insertMatch = sectionContent.match(
    /INSERT INTO \w+\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/i
  );

  if (!insertMatch) {
    console.log(`   No INSERT found for ${tableName}`);
    return [];
  }

  // Extract column names
  const columns = insertMatch[1].split(",").map((c) => c.trim().toLowerCase());

  // Get the VALUES section
  const valuesSection = insertMatch[2];
  const results: Record<string, unknown>[] = [];

  // Split by rows - each row starts with whitespace and (
  // Match rows considering that they may contain quoted strings with special chars
  let depth = 0;
  let rowStart = -1;
  let inQuote = false;

  for (let i = 0; i < valuesSection.length; i++) {
    const char = valuesSection[i];

    if (char === "'" && !inQuote) {
      inQuote = true;
      continue;
    }

    if (char === "'" && inQuote) {
      // Check for escaped quote
      if (valuesSection[i + 1] === "'") {
        i++; // Skip the escaped quote
        continue;
      }
      inQuote = false;
      continue;
    }

    if (inQuote) continue;

    if (char === "(") {
      if (depth === 0) rowStart = i + 1;
      depth++;
    }

    if (char === ")") {
      depth--;
      if (depth === 0 && rowStart !== -1) {
        const rowStr = valuesSection.slice(rowStart, i);
        const values = parseRowValues(rowStr);

        if (values.length === columns.length) {
          const obj: Record<string, unknown> = {};
          columns.forEach((col, idx) => {
            // Skip NOW() timestamp columns - let Supabase handle them
            if (
              values[idx] === "NOW()" ||
              col === "created_at" ||
              col === "updated_at"
            ) {
              return;
            }
            obj[col] = values[idx];
          });
          results.push(obj);
        }
        rowStart = -1;
      }
    }
  }

  return results;
}

/**
 * Parse a single row's comma-separated values, respecting quotes
 */
function parseRowValues(rowStr: string): (string | number | null)[] {
  const values: (string | number | null)[] = [];
  let current = "";
  let inQuote = false;
  let i = 0;

  while (i < rowStr.length) {
    const char = rowStr[i];

    if (char === "'" && !inQuote) {
      inQuote = true;
      i++;
      continue;
    }

    if (char === "'" && inQuote) {
      // Check for escaped quote ''
      if (rowStr[i + 1] === "'") {
        current += "'";
        i += 2;
        continue;
      }
      inQuote = false;
      i++;
      continue;
    }

    if (char === "," && !inQuote) {
      values.push(parseValue(current.trim()));
      current = "";
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // Don't forget the last value
  if (current.trim()) {
    values.push(parseValue(current.trim()));
  }

  return values;
}

/**
 * Parse a single value from SQL
 */
function parseValue(val: string): string | number | null {
  if (val === "NULL" || val === "null") return null;
  if (val === "NOW()") return "NOW()";

  // Check if it's a number
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);

  return val;
}

async function importSeedToStaging() {
  console.log("\n⚠️  IMPORT SEED DATA TO STAGING\n");
  console.log("═".repeat(80));

  console.log("🔍 Environment Check:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(
    `   ✅ Safety check passed: Using TEST project (${TEST_PROJECT_ID})`
  );
  console.log("═".repeat(80));

  const supabase = createClient(supabaseUrl!, supabaseKey!);

  // Step 1: Read seed file
  const sqlPath = path.join(
    process.cwd(),
    "tests",
    "fixtures",
    "seed-data.sql"
  );

  console.log("\n📂 Reading seed file...");
  try {
    await fs.access(sqlPath);
  } catch {
    console.error(`❌ File not found: ${sqlPath}`);
    console.log("\n💡 Generate the file first with:");
    console.log("   npm run staging:export");
    process.exit(1);
  }

  const sqlContent = await fs.readFile(sqlPath, "utf-8");
  console.log("✅ Seed file loaded");

  // Step 2: Clear existing data
  console.log("\n🗑️  Clearing existing data...");

  const tables = [
    "part_360_frames",
    "part_images",
    "cross_references",
    "vehicle_applications",
    "parts",
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error(`   ❌ Error clearing ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ Cleared ${table}`);
    }
  }

  // Step 3: Parse and insert parts
  console.log("\n📥 Importing data...");

  const parts = parseSqlValues(sqlContent, "parts") as unknown as ParsedPart[];
  console.log(`\n   Importing ${parts.length} parts...`);

  // Batch insert parts (Supabase has row limits)
  const BATCH_SIZE = 500;
  let partsInserted = 0;

  for (let i = 0; i < parts.length; i += BATCH_SIZE) {
    const batch = parts.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("parts").insert(batch);

    if (error) {
      console.error(
        `   ❌ Parts batch ${i / BATCH_SIZE + 1} failed: ${error.message}`
      );
      // Try to continue with other batches
    } else {
      partsInserted += batch.length;
    }
  }
  console.log(`   ✅ Parts: ${partsInserted} inserted`);

  // Step 4: Parse and insert vehicle applications
  const vehicles = parseSqlValues(
    sqlContent,
    "vehicle_applications"
  ) as unknown as ParsedVehicle[];
  console.log(`\n   Importing ${vehicles.length} vehicle applications...`);

  let vehiclesInserted = 0;
  for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
    const batch = vehicles.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("vehicle_applications").insert(batch);

    if (error) {
      console.error(
        `   ❌ Vehicles batch ${i / BATCH_SIZE + 1} failed: ${error.message}`
      );
    } else {
      vehiclesInserted += batch.length;
    }
  }
  console.log(`   ✅ Vehicle Applications: ${vehiclesInserted} inserted`);

  // Step 5: Parse and insert cross references
  const crossRefs = parseSqlValues(
    sqlContent,
    "cross_references"
  ) as unknown as ParsedCrossRef[];
  console.log(`\n   Importing ${crossRefs.length} cross references...`);

  let crossRefsInserted = 0;
  for (let i = 0; i < crossRefs.length; i += BATCH_SIZE) {
    const batch = crossRefs.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("cross_references").insert(batch);

    if (error) {
      console.error(
        `   ❌ Cross refs batch ${i / BATCH_SIZE + 1} failed: ${error.message}`
      );
    } else {
      crossRefsInserted += batch.length;
    }
  }
  console.log(`   ✅ Cross References: ${crossRefsInserted} inserted`);

  // Step 6: Verify counts
  console.log("\n📊 Verification:");

  const { count: partsCount } = await supabase
    .from("parts")
    .select("*", { count: "exact", head: true });
  const { count: vehiclesCount } = await supabase
    .from("vehicle_applications")
    .select("*", { count: "exact", head: true });
  const { count: crossRefsCount } = await supabase
    .from("cross_references")
    .select("*", { count: "exact", head: true });

  console.log(`   Parts: ${partsCount}`);
  console.log(`   Vehicle Applications: ${vehiclesCount}`);
  console.log(`   Cross References: ${crossRefsCount}`);
  console.log(
    `   Total Records: ${(partsCount || 0) + (vehiclesCount || 0) + (crossRefsCount || 0)}`
  );

  console.log("\n═".repeat(80));
  console.log("✅ SEED DATA IMPORTED TO STAGING");
  console.log("═".repeat(80));
}

// Run the import
importSeedToStaging()
  .then(() => {
    console.log("\n✅ Import complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });
