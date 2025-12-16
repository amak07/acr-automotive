/**
 * Generate Combined Add+Update Test Fixture
 *
 * This creates a fixture that tests both ADD and UPDATE operations in a single import:
 * 1. First import: Creates 5 baseline parts
 * 2. Export those parts to get their real UUIDs
 * 3. Second import: Adds 3 new parts AND updates 2 of the existing parts
 */

import ExcelJS from "exceljs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  SHEET_NAMES,
  PARTS_COLUMNS,
  VEHICLE_APPLICATIONS_COLUMNS,
  CROSS_REFERENCES_COLUMNS,
} from "../../src/services/excel/shared/constants";

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

async function generateAddUpdateFixture() {
  console.log("🔧 Generating Combined Add+Update Fixture\n");

  // Fetch current parts from database
  const { data: parts, error } = await supabase
    .from("parts")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    console.error("❌ Error fetching parts:", error);
    process.exit(1);
  }

  if (!parts || parts.length === 0) {
    console.error(
      "❌ No parts found in database. Import valid-add-new-parts.xlsx first."
    );
    process.exit(1);
  }

  console.log(`📊 Found ${parts.length} parts in database\n`);

  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  // Add first 3 parts unchanged (no update)
  for (let i = 0; i < 3 && i < parts.length; i++) {
    const part = parts[i];
    partsSheet.addRow([
      part.id,
      part.acr_sku,
      part.part_type,
      part.position_type || "",
      part.abs_type || "",
      part.drive_type || "",
      part.bolt_pattern || "",
      part.specifications || "",
    ]);
  }

  // Update parts 4 and 5 (change specifications)
  if (parts.length >= 4) {
    const part4 = parts[3];
    partsSheet.addRow([
      part4.id,
      part4.acr_sku,
      part4.part_type,
      part4.position_type || "",
      part4.abs_type || "",
      part4.drive_type || "",
      part4.bolt_pattern || "",
      "🔄 UPDATED SPECIFICATIONS - Testing update flow",
    ]);
  }

  if (parts.length >= 5) {
    const part5 = parts[4];
    partsSheet.addRow([
      part5.id,
      part5.acr_sku,
      part5.part_type,
      "TRASERA", // Change position_type
      "P/ABS", // Change abs_type
      part5.drive_type || "",
      part5.bolt_pattern || "",
      "🔄 UPDATED - Changed position and ABS type",
    ]);
  }

  // Add 3 brand new parts
  partsSheet.addRow([
    "",
    "ACR-TEST-006",
    "BALATA",
    "DELANTERA",
    "C/ABS",
    "",
    "",
    "New part 6",
  ]);
  partsSheet.addRow([
    "",
    "ACR-TEST-007",
    "MAZA",
    "TRASERA",
    "P/ABS",
    "5 BIRLOS",
    "5x10",
    "New part 7",
  ]);
  partsSheet.addRow([
    "",
    "ACR-TEST-008",
    "ROTOR",
    "DELANTERA",
    "",
    "4 BIRLOS",
    "",
    "New part 8",
  ]);

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
    "tests",
    "fixtures",
    "excel",
    "unit",
    "valid-add-and-update.xlsx"
  );
  await workbook.xlsx.writeFile(outputPath);

  console.log("✅ Created: valid-add-and-update.xlsx");
  console.log("\n📝 Fixture contains:");
  console.log(
    `   - 3 parts unchanged (${parts
      .slice(0, 3)
      .map((p) => p.acr_sku)
      .join(", ")})`
  );
  console.log(
    `   - 2 parts updated (${parts
      .slice(3, 5)
      .map((p) => p.acr_sku)
      .join(", ")})`
  );
  console.log("   - 3 new parts (ACR-TEST-006, ACR-TEST-007, ACR-TEST-008)");
  console.log("\n🎯 Expected diff: +3 adds, ~2 updates, 0 deletes\n");
}

generateAddUpdateFixture();
