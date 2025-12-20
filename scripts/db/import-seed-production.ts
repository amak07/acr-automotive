#!/usr/bin/env tsx
/**
 * Import Seed Data to Production Database
 *
 * This script imports tests/fixtures/seed-data.sql into the production Supabase database.
 * Uses Supabase REST API with service_role key to bypass RLS.
 *
 * Usage:
 *   npm run prod:import-seed
 *
 * Requires NODE_ENV=production to be set by npm script
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";
import { createClient } from "@supabase/supabase-js";

// Load production environment
if (process.env.NODE_ENV === ("production" as string)) {
  dotenv.config({
    path: path.join(process.cwd(), ".env.production"),
    override: true,
  });
} else {
  console.error("❌ ERROR: This script must be run with NODE_ENV=production");
  console.error("   Use: npm run prod:import-seed");
  process.exit(1);
}

// Safety check - verify we're using the PRODUCTION Supabase project
const PROD_PROJECT_ID = "bzfnqhghtmsiecvvgmkw"; // acr-automotive production project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl?.includes(PROD_PROJECT_ID)) {
  console.error("\n❌ SAFETY CHECK FAILED!");
  console.error("   This is NOT the production database project!");
  console.error(`   Current URL: ${supabaseUrl}`);
  console.error(`   Expected project ID: ${PROD_PROJECT_ID}`);
  console.error("\n   Aborting!\n");
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase credentials in .env.production");
  console.error(
    "   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
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
 */
function parseSqlValues(
  sqlContent: string,
  tableName: string
): Record<string, unknown>[] {
  const sectionMarker = tableName.toUpperCase().replace(/_/g, " ");
  const sectionStart = sqlContent.indexOf(`-- ${sectionMarker}`);

  if (sectionStart === -1) {
    console.log(`   No section marker found for ${tableName}`);
    return [];
  }

  const afterSection = sqlContent.slice(sectionStart);
  const nextSectionMatch = afterSection.slice(100).match(/\n-- =+\n-- [A-Z]/);
  const sectionEnd = nextSectionMatch
    ? sectionStart + 100 + nextSectionMatch.index!
    : sqlContent.length;

  const sectionContent = sqlContent.slice(sectionStart, sectionEnd);

  const insertMatch = sectionContent.match(
    /INSERT INTO \w+\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/i
  );

  if (!insertMatch) {
    console.log(`   No INSERT found for ${tableName}`);
    return [];
  }

  const columns = insertMatch[1].split(",").map((c) => c.trim().toLowerCase());
  const valuesSection = insertMatch[2];
  const results: Record<string, unknown>[] = [];

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
      if (valuesSection[i + 1] === "'") {
        i++;
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

  if (current.trim()) {
    values.push(parseValue(current.trim()));
  }

  return values;
}

function parseValue(val: string): string | number | null {
  if (val === "NULL" || val === "null") return null;
  if (val === "NOW()") return "NOW()";

  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);

  return val;
}

async function importSeedToProduction() {
  console.log("\n🚨 IMPORT SEED DATA TO PRODUCTION\n");
  console.log("═".repeat(80));

  console.log("🔍 Environment Check:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   ✅ Using PRODUCTION project (${PROD_PROJECT_ID})`);
  console.log("═".repeat(80));

  // Use service_role key for full access (bypasses RLS)
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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

  const BATCH_SIZE = 500;
  let partsInserted = 0;

  for (let i = 0; i < parts.length; i += BATCH_SIZE) {
    const batch = parts.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("parts").insert(batch);

    if (error) {
      console.error(
        `   ❌ Parts batch ${i / BATCH_SIZE + 1} failed: ${error.message}`
      );
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
  console.log("✅ SEED DATA IMPORTED TO PRODUCTION");
  console.log("═".repeat(80));
}

// Run the import
importSeedToProduction()
  .then(() => {
    console.log("\n✅ Import complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  });
