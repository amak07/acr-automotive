/**
 * Generate Test Fixtures for ADD and UPDATE Operations
 *
 * IMPORTANT: The UPDATE fixture must be generated AFTER importing the ADD fixture
 * because it needs to fetch the real UUIDs from the database.
 *
 * Usage:
 *   1. Generate ADD fixture (standalone):
 *      npx tsx scripts/test/generate-test-parts-with-uuids.ts add
 *
 *   2. Import valid-add-new-parts.xlsx through the UI
 *
 *   3. Generate UPDATE fixture (requires database):
 *      npx tsx scripts/test/generate-test-parts-with-uuids.ts update
 *
 *   4. Import valid-update-existing.xlsx through the UI
 *
 * The UPDATE fixture queries the database for the 5 test parts (ACR-TEST-001 through
 * ACR-TEST-005) and uses their real UUIDs to create an Excel file that modifies 3 of them.
 *
 * This approach ensures:
 * - UUIDs match between database and Excel file (prevents E19 errors)
 * - Repeatable test workflow
 * - Clear separation between ADD and UPDATE testing
 */

import ExcelJS from "exceljs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  SHEET_NAMES,
  PARTS_COLUMNS,
  VEHICLE_APPLICATIONS_COLUMNS,
  CROSS_REFERENCES_COLUMNS,
} from "../../src/services/excel/shared/constants";

// Load staging environment (remote TEST database)
dotenv.config({ path: path.join(process.cwd(), ".env.staging") });

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase credentials");
  console.error("   Make sure .env.staging file exists with:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function createWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ACR Automotive Test Suite";
  workbook.created = new Date();
  return workbook;
}

function addWorksheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  columns:
    | typeof PARTS_COLUMNS
    | typeof VEHICLE_APPLICATIONS_COLUMNS
    | typeof CROSS_REFERENCES_COLUMNS
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(sheetName);

  const allHeaders = columns.map((col) => col.header);
  sheet.addRow(allHeaders);

  columns.forEach((col, index) => {
    if (col.hidden) {
      const column = sheet.getColumn(index + 1);
      column.hidden = true;
    }
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD3D3D3" },
  };

  columns.forEach((col, index) => {
    const excelColumn = sheet.getColumn(index + 1);
    excelColumn.width = col.width || 15;
  });

  return sheet;
}

async function generateAddFixture() {
  console.log("📦 Generating: valid-add-new-parts.xlsx\n");

  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  // Add 5 new parts with EMPTY _id (database will generate UUIDs)
  // We use predictable SKUs so we can query them later for the update fixture
  const newParts = [
    [
      "",
      "ACR-TEST-001",
      "MAZA",
      "DELANTERA",
      "C/ABS",
      "4 BIRLOS",
      "4x8",
      "Test part 1",
    ],
    [
      "",
      "ACR-TEST-002",
      "MAZA",
      "TRASERA",
      "P/ABS",
      "5 BIRLOS",
      "5x10",
      "Test part 2",
    ],
    [
      "",
      "ACR-TEST-003",
      "ROTOR",
      "DELANTERA",
      "C/ABS",
      "4 BIRLOS",
      "",
      "Test part 3",
    ],
    ["", "ACR-TEST-004", "ROTOR", "TRASERA", "", "", "", "Test part 4"],
    ["", "ACR-TEST-005", "BALATA", "", "", "", "", "Test part 5"],
  ];

  newParts.forEach((part) => partsSheet.addRow(part));

  // Empty vehicle applications and cross references
  addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );

  const outputPath = path.join(
    process.cwd(),
    "fixtures",
    "excel",
    "unit",
    "valid-add-new-parts.xlsx"
  );
  await workbook.xlsx.writeFile(outputPath);

  console.log("✅ Created: valid-add-new-parts.xlsx");
  console.log("   Expected: +5 adds, 0 updates, 0 deletes\n");
}

async function generateUpdateFixture() {
  console.log("📦 Generating: valid-update-existing.xlsx\n");

  // Fetch the test parts from database (must exist first!)
  const { data: parts, error } = await supabase
    .from("parts")
    .select("*")
    .in("acr_sku", [
      "ACR-TEST-001",
      "ACR-TEST-002",
      "ACR-TEST-003",
      "ACR-TEST-004",
      "ACR-TEST-005",
    ])
    .order("acr_sku", { ascending: true });

  if (error || !parts || parts.length !== 5) {
    console.error("❌ Error: Test parts not found in database!");
    console.error("   You must import valid-add-new-parts.xlsx first.");
    console.error(`   Found ${parts?.length || 0} parts, expected 5.`);
    process.exit(1);
  }

  console.log(`✓ Found ${parts.length} test parts in database\n`);

  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  // Update parts 1, 2, and 3 (using their real UUIDs from database)
  // Keep parts 4 and 5 unchanged

  // Update part 1: Change bolt pattern
  partsSheet.addRow([
    parts[0].id,
    parts[0].acr_sku,
    parts[0].part_type,
    parts[0].position_type || "",
    parts[0].abs_type || "",
    "5 BIRLOS", // Changed from 4 BIRLOS
    "5x10", // Changed from 4x8
    "🔄 UPDATED: Changed bolt pattern from 4x8 to 5x10",
  ]);

  // Update part 2: Change position and ABS type
  partsSheet.addRow([
    parts[1].id,
    parts[1].acr_sku,
    parts[1].part_type,
    "DELANTERA", // Changed from TRASERA
    "C/ABS", // Changed from P/ABS
    "4 BIRLOS",
    "4x8",
    "🔄 UPDATED: Changed from TRASERA P/ABS to DELANTERA C/ABS",
  ]);

  // Update part 3: Change drive type and bolt pattern
  partsSheet.addRow([
    parts[2].id,
    parts[2].acr_sku,
    parts[2].part_type,
    parts[2].position_type || "",
    parts[2].abs_type || "",
    "5 BIRLOS", // Changed from 4 BIRLOS
    "5x10", // Was empty before
    "🔄 UPDATED: Added drive type and changed bolt pattern",
  ]);

  // Keep part 4 unchanged
  partsSheet.addRow([
    parts[3].id,
    parts[3].acr_sku,
    parts[3].part_type,
    parts[3].position_type || "",
    parts[3].abs_type || "",
    parts[3].drive_type || "",
    parts[3].bolt_pattern || "",
    parts[3].specifications || "",
  ]);

  // Keep part 5 unchanged
  partsSheet.addRow([
    parts[4].id,
    parts[4].acr_sku,
    parts[4].part_type,
    parts[4].position_type || "",
    parts[4].abs_type || "",
    parts[4].drive_type || "",
    parts[4].bolt_pattern || "",
    parts[4].specifications || "",
  ]);

  addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );

  const outputPath = path.join(
    process.cwd(),
    "fixtures",
    "excel",
    "unit",
    "valid-update-existing.xlsx"
  );
  await workbook.xlsx.writeFile(outputPath);

  console.log("✅ Created: valid-update-existing.xlsx");
  console.log("   Expected: 0 adds, ~3 updates, 0 deletes");
  console.log(
    `   Parts to be updated: ${parts
      .slice(0, 3)
      .map((p) => p.acr_sku)
      .join(", ")}`
  );
  console.log(
    `   Parts unchanged: ${parts
      .slice(3)
      .map((p) => p.acr_sku)
      .join(", ")}\n`
  );
}

async function main() {
  const mode = process.argv[2] || "both";

  console.log("🔧 Generating Test Fixtures");
  console.log("============================\n");

  if (mode === "both" || mode === "add") {
    await generateAddFixture();
  }

  if (mode === "both" || mode === "update") {
    await generateUpdateFixture();
  }

  console.log("✅ Fixture generation complete!\n");
  console.log("📝 Test sequence:");
  console.log("   1. Import: valid-add-new-parts.xlsx    → +5 adds");
  console.log(
    "   2. Run: npx tsx scripts/test/generate-test-parts-with-uuids.ts update"
  );
  console.log("   3. Import: valid-update-existing.xlsx  → ~3 updates");
  console.log("   4. Rollback to test restore functionality\n");
}

main();
