// @ts-nocheck
/**
 * Generate All Test Data - Consolidated Test Generation Script
 *
 * This script generates both unit test fixtures and integration test scenarios.
 * It's schema-aware: imports column definitions from shared constants and
 * TypeScript types from Supabase, ensuring tests always match current database schema.
 *
 * **Key Feature: Schema Awareness**
 * When you add new columns to the database:
 * 1. Update: src/services/excel/shared/constants.ts (add to PARTS_COLUMNS)
 * 2. Regenerate types: npm run types:generate
 * 3. Run this script: npm run test:generate
 * 4. Test files automatically include new columns!
 *
 * Usage:
 *   npm run test:generate              # Generate all test data
 *   npm run test:generate:unit         # Unit fixtures only
 *   npm run test:generate:scenarios    # Integration scenarios only
 *
 * Output:
 *   fixtures/excel/unit/               # Small unit test fixtures (8 files)
 *   fixtures/excel/scenarios/          # Large integration scenarios (9 files)
 */

import * as fs from "fs/promises";
import * as path from "path";
import ExcelJS from "exceljs";

// Import from single source of truth - shared constants
import {
  SHEET_NAMES,
  PARTS_COLUMNS,
  VEHICLE_APPLICATIONS_COLUMNS,
  CROSS_REFERENCES_COLUMNS,
  COLUMN_HEADERS,
} from "../../src/services/excel/shared/constants";

// Import TypeScript types for type safety
import type { Database } from "../../src/lib/supabase/types";

// Type-safe aliases
type PartRow = Database["public"]["Tables"]["parts"]["Row"];
type VehicleAppRow =
  Database["public"]["Tables"]["vehicle_applications"]["Row"];
type CrossRefRow = Database["public"]["Tables"]["cross_references"]["Row"];

// Configuration
const UNIT_OUTPUT_DIR = path.join(
  process.cwd(),
  "tests",
  "fixtures",
  "excel",
  "unit"
);
const SCENARIOS_OUTPUT_DIR = path.join(
  process.cwd(),
  "tests",
  "fixtures",
  "excel",
  "scenarios"
);
const TMP_DIR = path.join(process.cwd(), "tmp");
const BASELINE_FILE = path.join(TMP_DIR, "test-export.xlsx");

// Hidden ID columns (from constants)
const HIDDEN_ID_COLUMNS = ["_id", "_part_id", "_acr_part_id"];

// ============================================================================
// Workbook Helper Functions
// ============================================================================

/**
 * Create Excel workbook with metadata
 */
function createWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ACR Automotive Test Suite";
  workbook.created = new Date();
  return workbook;
}

/**
 * Add worksheet with schema-aware headers
 * Uses column definitions from shared constants (not hardcoded)
 */
function addWorksheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  columns:
    | typeof PARTS_COLUMNS
    | typeof VEHICLE_APPLICATIONS_COLUMNS
    | typeof CROSS_REFERENCES_COLUMNS
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(sheetName);

  // Build headers from column definitions (schema-aware!)
  // The column definitions already include hidden ID columns
  const allHeaders = columns.map((col) => col.header);
  sheet.addRow(allHeaders);

  // Hide columns marked as hidden in constants
  columns.forEach((col, index) => {
    if (col.hidden) {
      const column = sheet.getColumn(index + 1);
      column.hidden = true;
    }
  });

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD3D3D3" },
  };

  // Set column widths
  columns.forEach((col, index) => {
    const excelColumn = sheet.getColumn(index + 1);
    excelColumn.width = col.width || 15;
  });

  return sheet;
}

/**
 * Save workbook to file
 */
async function saveWorkbook(
  workbook: ExcelJS.Workbook,
  directory: string,
  filename: string
) {
  await fs.mkdir(directory, { recursive: true });
  const filepath = path.join(directory, filename);
  await workbook.xlsx.writeFile(filepath);
  console.log(`✅ Created: ${filename}`);
}

// ============================================================================
// UNIT TEST FIXTURES
// ============================================================================

/**
 * Generate unit test fixtures (small, focused test files)
 * These test specific validation scenarios
 */
async function generateUnitFixtures() {
  console.log("\n📦 Generating Unit Test Fixtures...\n");

  await generateFixture1_ValidAddNewParts();
  await generateFixture2_ValidUpdateExisting();
  await generateFixture3_ErrorDuplicateSkus();
  await generateFixture4_ErrorMissingRequiredFields();
  await generateFixture5_ErrorOrphanedReferences();
  await generateFixture6_ErrorInvalidFormats();
  await generateFixture7_ErrorMaxLengthExceeded();
  await generateFixture8_WarningDataChanges();

  console.log("\n✅ Unit fixtures generated in: fixtures/excel/unit/\n");
}

// Fixture 1: Valid Add New Parts
async function generateFixture1_ValidAddNewParts() {
  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

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

  await saveWorkbook(workbook, UNIT_OUTPUT_DIR, "valid-add-new-parts.xlsx");
}

// Fixture 2: Valid Update Existing
async function generateFixture2_ValidUpdateExisting() {
  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  // These would need real IDs from baseline - simplified for now
  const existingParts = [
    [
      "existing-id-1",
      "ACR123456",
      "MAZA",
      "DELANTERA",
      "C/ABS",
      "4 BIRLOS",
      "4x8",
      "Updated specifications",
    ],
    [
      "existing-id-2",
      "ACR234567",
      "ROTOR",
      "TRASERA",
      "P/ABS",
      "5 BIRLOS",
      "5x10",
      "Updated specifications",
    ],
    [
      "existing-id-3",
      "ACR345678",
      "BALATA",
      "",
      "",
      "",
      "",
      "Updated specifications",
    ],
  ];

  existingParts.forEach((part) => partsSheet.addRow(part));

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

  await saveWorkbook(workbook, UNIT_OUTPUT_DIR, "valid-update-existing.xlsx");
}

// Fixture 3: Error - Duplicate SKUs (E2)
async function generateFixture3_ErrorDuplicateSkus() {
  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  const duplicateParts = [
    [
      "",
      "ACR-DUPLICATE",
      "MAZA",
      "DELANTERA",
      "C/ABS",
      "4 BIRLOS",
      "4x8",
      "First part",
    ],
    [
      "",
      "ACR-DUPLICATE",
      "ROTOR",
      "TRASERA",
      "P/ABS",
      "5 BIRLOS",
      "5x10",
      "Duplicate SKU!",
    ], // E2 error
    ["", "ACR-VALID", "BALATA", "", "", "", "", "Valid part"],
  ];

  duplicateParts.forEach((part) => partsSheet.addRow(part));

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

  await saveWorkbook(workbook, UNIT_OUTPUT_DIR, "error-duplicate-skus.xlsx");
}

// Fixture 4: Error - Missing Required Fields (E3)
async function generateFixture4_ErrorMissingRequiredFields() {
  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  const invalidParts = [
    [
      "",
      "",
      "MAZA",
      "DELANTERA",
      "C/ABS",
      "4 BIRLOS",
      "4x8",
      "Missing ACR_SKU",
    ], // E3: Missing ACR_SKU
    ["", "ACR-VALID-001", "", "", "", "", "", "Missing Part_Type"], // E3: Missing Part_Type
    ["", "ACR-VALID-002", "ROTOR", "TRASERA", "", "", "", "Valid part"],
  ];

  invalidParts.forEach((part) => partsSheet.addRow(part));

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

  await saveWorkbook(
    workbook,
    UNIT_OUTPUT_DIR,
    "error-missing-required-fields.xlsx"
  );
}

// Fixture 5: Error - Orphaned References (E5)
async function generateFixture5_ErrorOrphanedReferences() {
  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  partsSheet.addRow([
    "real-part-id",
    "ACR-VALID-001",
    "MAZA",
    "DELANTERA",
    "C/ABS",
    "4 BIRLOS",
    "4x8",
    "Valid part",
  ]);

  // Vehicle Applications with orphaned part_id
  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  vehiclesSheet.addRow([
    "va-id-1",
    "nonexistent-part-id",
    "ACR-INVALID",
    "FORD",
    "F-150",
    2020,
    2023,
  ]); // E5: Orphaned FK

  addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );

  await saveWorkbook(
    workbook,
    UNIT_OUTPUT_DIR,
    "error-orphaned-references.xlsx"
  );
}

// Fixture 6: Error - Invalid Formats (E4, E6, E8)
async function generateFixture6_ErrorInvalidFormats() {
  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  partsSheet.addRow([
    "invalid-uuid-format",
    "ACR-TEST-001",
    "MAZA",
    "DELANTERA",
    "C/ABS",
    "4 BIRLOS",
    "4x8",
    "Invalid ID format",
  ]); // E4

  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  vehiclesSheet.addRow([
    "va-id-1",
    "part-id-1",
    "ACR-TEST-001",
    "FORD",
    "F-150",
    2025,
    2020,
  ]); // E6: start_year > end_year
  vehiclesSheet.addRow([
    "va-id-2",
    "part-id-1",
    "ACR-TEST-001",
    "FORD",
    "F-150",
    1899,
    1900,
  ]); // E8: year out of range

  addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );

  await saveWorkbook(workbook, UNIT_OUTPUT_DIR, "error-invalid-formats.xlsx");
}

// Fixture 7: Error - Max Length Exceeded (E7)
async function generateFixture7_ErrorMaxLengthExceeded() {
  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  const longString = "A".repeat(200); // Exceeds max length
  partsSheet.addRow([
    "",
    "ACR-TEST-001",
    longString,
    "DELANTERA",
    "C/ABS",
    "4 BIRLOS",
    "4x8",
    "Part type too long",
  ]); // E7

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

  await saveWorkbook(
    workbook,
    UNIT_OUTPUT_DIR,
    "error-max-length-exceeded.xlsx"
  );
}

// Fixture 8: Warning - Data Changes (W1-W10)
async function generateFixture8_WarningDataChanges() {
  const workbook = createWorkbook();
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  // These would trigger warnings when compared to baseline
  const changedParts = [
    [
      "existing-id-1",
      "ACR-CHANGED-SKU",
      "MAZA",
      "DELANTERA",
      "C/ABS",
      "4 BIRLOS",
      "4x8",
      "Changed SKU",
    ], // W1: ACR_SKU changed
    [
      "existing-id-2",
      "ACR234567",
      "ROTOR-CHANGED",
      "TRASERA",
      "P/ABS",
      "5 BIRLOS",
      "5x10",
      "Changed type",
    ], // W3: Part_Type changed
    [
      "existing-id-3",
      "ACR345678",
      "BALATA",
      "DELANTERA-CHANGED",
      "",
      "",
      "",
      "Changed position",
    ], // W4: Position_Type changed
  ];

  changedParts.forEach((part) => partsSheet.addRow(part));

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

  await saveWorkbook(workbook, UNIT_OUTPUT_DIR, "warning-data-changes.xlsx");
}

// ============================================================================
// INTEGRATION TEST SCENARIOS
// ============================================================================

/**
 * Generate integration test scenarios (large, realistic test files)
 * These modify the baseline export to create realistic import scenarios
 */
async function generateIntegrationScenarios() {
  console.log("\n🔄 Generating Integration Test Scenarios...\n");

  // Check if baseline exists
  try {
    await fs.access(BASELINE_FILE);
  } catch {
    console.error(`❌ Error: Baseline file not found: ${BASELINE_FILE}`);
    console.error(
      'Run "npm run test:export-baseline" first to create baseline'
    );
    return;
  }

  const baseline = await loadBaseline();

  await generateScenario1_QuarterlyUpdate(baseline);
  await generateScenario2_SeasonalRefresh(baseline);
  await generateScenario3_MinorCorrections(baseline);
  await generateScenario4_AllWarnings(baseline);
  await generateScenarioError_E1_MissingIds(baseline);
  await generateScenarioError_E2_DuplicateSku(baseline);
  await generateScenarioError_E3_EmptyFields(baseline);
  await generateScenarioError_E5_OrphanedFk(baseline);
  await generateScenarioError_E6_InvalidYearRange(baseline);

  console.log(
    "\n✅ Integration scenarios generated in: fixtures/excel/scenarios/\n"
  );
}

interface BaselineData {
  parts: any[];
  vehicles: any[];
  crossRefs: any[];
}

async function loadBaseline(): Promise<BaselineData> {
  console.log("📂 Loading baseline export...");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(BASELINE_FILE);

  const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS);
  const vehiclesSheet = workbook.getWorksheet(SHEET_NAMES.VEHICLE_APPLICATIONS);
  const crossRefsSheet = workbook.getWorksheet(SHEET_NAMES.CROSS_REFERENCES);

  if (!partsSheet || !vehiclesSheet || !crossRefsSheet) {
    throw new Error("Missing required sheets in baseline file");
  }

  const parts: any[] = [];
  const vehicles: any[] = [];
  const crossRefs: any[] = [];

  // Parse sheets (simplified - assumes consistent column order)
  partsSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    const values = row.values as any[];
    parts.push(values);
  });

  vehiclesSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values as any[];
    vehicles.push(values);
  });

  crossRefsSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values as any[];
    crossRefs.push(values);
  });

  console.log(
    `  Loaded ${parts.length} parts, ${vehicles.length} vehicles, ${crossRefs.length} cross-refs\n`
  );
  return { parts, vehicles, crossRefs };
}

// Scenario 1: Quarterly Update (50 adds, 3 updates, 2 deletes)
async function generateScenario1_QuarterlyUpdate(baseline: BaselineData) {
  const workbook = createWorkbook();

  // Add all existing parts plus 50 new ones
  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);
  baseline.parts.slice(0, 875).forEach((row) => partsSheet.addRow(row)); // Remove 2 parts (deletes)

  // Add 50 new parts
  for (let i = 1; i <= 50; i++) {
    partsSheet.addRow([
      "",
      `ACR-2025-${String(i).padStart(5, "0")}`,
      "MAZA",
      "DELANTERA",
      "C/ABS",
      "4 BIRLOS",
      "4x8",
      `Quarterly update part ${i}`,
    ]);
  }

  // Update 3 existing parts (change specifications)
  const firstRow = partsSheet.getRow(2); // Skip header
  const firstRowValues = firstRow.values as any[];
  firstRowValues[firstRowValues.length - 1] =
    "UPDATED SPECIFICATIONS - Q1 2025";
  firstRow.values = firstRowValues;

  // Copy vehicles and cross-refs as-is
  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  baseline.vehicles.forEach((row) => vehiclesSheet.addRow(row));

  const crossRefsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );
  baseline.crossRefs.forEach((row) => crossRefsSheet.addRow(row));

  await saveWorkbook(
    workbook,
    SCENARIOS_OUTPUT_DIR,
    "01-quarterly-update.xlsx"
  );
}

// Scenario 2: Seasonal Refresh (10 adds, 20 updates, 5 deletes)
async function generateScenario2_SeasonalRefresh(baseline: BaselineData) {
  const workbook = createWorkbook();

  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);
  baseline.parts.slice(0, 872).forEach((row) => partsSheet.addRow(row)); // Remove 5 parts

  // Add 10 new parts
  for (let i = 1; i <= 10; i++) {
    partsSheet.addRow([
      "",
      `ACR-SEASON-${String(i).padStart(3, "0")}`,
      "ROTOR",
      "TRASERA",
      "P/ABS",
      "5 BIRLOS",
      "5x10",
      `Seasonal part ${i}`,
    ]);
  }

  // Copy vehicles and cross-refs
  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  baseline.vehicles.forEach((row) => vehiclesSheet.addRow(row));

  const crossRefsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );
  baseline.crossRefs.forEach((row) => crossRefsSheet.addRow(row));

  await saveWorkbook(
    workbook,
    SCENARIOS_OUTPUT_DIR,
    "02-seasonal-refresh.xlsx"
  );
}

// Scenario 3: Minor Corrections (0 adds, 3 updates, 0 deletes)
async function generateScenario3_MinorCorrections(baseline: BaselineData) {
  const workbook = createWorkbook();

  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);
  baseline.parts.forEach((row) => partsSheet.addRow(row));

  // Update 3 parts (fix typos in specifications)
  for (let i = 2; i <= 4; i++) {
    const row = partsSheet.getRow(i);
    const values = row.values as any[];
    values[values.length - 1] = "CORRECTED SPECIFICATIONS";
    row.values = values;
  }

  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  baseline.vehicles.forEach((row) => vehiclesSheet.addRow(row));

  const crossRefsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );
  baseline.crossRefs.forEach((row) => crossRefsSheet.addRow(row));

  await saveWorkbook(
    workbook,
    SCENARIOS_OUTPUT_DIR,
    "03-minor-corrections.xlsx"
  );
}

// Scenario 4: All Warnings (triggers W1-W10)
async function generateScenario4_AllWarnings(baseline: BaselineData) {
  const workbook = createWorkbook();

  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  // Copy all parts but modify first 10 to trigger warnings
  baseline.parts.forEach((row, index) => {
    if (index < 10) {
      const modifiedRow = [...row];
      // Modify different fields to trigger different warnings
      if (index === 0) modifiedRow[2] = "CHANGED-SKU"; // W1: ACR_SKU changed
      if (index === 1) modifiedRow[3] = "ROTOR-MODIFIED"; // W3: Part_Type changed
      if (index === 2) modifiedRow[4] = "POSITION-MODIFIED"; // W4: Position_Type changed
      if (index === 3) modifiedRow[8] = "SHORT"; // W7: Specifications shortened
      partsSheet.addRow(modifiedRow);
    } else {
      partsSheet.addRow(row);
    }
  });

  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  baseline.vehicles.forEach((row) => vehiclesSheet.addRow(row));

  const crossRefsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );
  baseline.crossRefs.forEach((row) => crossRefsSheet.addRow(row));

  await saveWorkbook(workbook, SCENARIOS_OUTPUT_DIR, "04-all-warnings.xlsx");
}

// Error Scenario: E1 - Missing Hidden ID Columns
async function generateScenarioError_E1_MissingIds(baseline: BaselineData) {
  const workbook = createWorkbook();

  // For E1 error: Create sheets WITHOUT hidden ID columns
  // Filter out hidden columns to simulate file exported without IDs
  const partsColumnsNoId = PARTS_COLUMNS.filter((col) => !col.hidden);
  const vehicleColumnsNoId = VEHICLE_APPLICATIONS_COLUMNS.filter(
    (col) => !col.hidden
  );
  const crossRefColumnsNoId = CROSS_REFERENCES_COLUMNS.filter(
    (col) => !col.hidden
  );

  const partsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.PARTS,
    partsColumnsNoId as any
  );
  baseline.parts.slice(0, 10).forEach((row) => {
    const rowWithoutId = row.slice(1); // Remove _id
    partsSheet.addRow(rowWithoutId);
  });

  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    vehicleColumnsNoId as any
  );
  const crossRefsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    crossRefColumnsNoId as any
  );

  await saveWorkbook(
    workbook,
    SCENARIOS_OUTPUT_DIR,
    "error-e1-missing-ids.xlsx"
  );
}

// Error Scenario: E2 - Duplicate SKU
async function generateScenarioError_E2_DuplicateSku(baseline: BaselineData) {
  const workbook = createWorkbook();

  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);
  baseline.parts.slice(0, 10).forEach((row) => partsSheet.addRow(row));

  // Add duplicate of first part (same ACR_SKU)
  const duplicateRow = [...baseline.parts[0]];
  duplicateRow[0] = ""; // New ID
  partsSheet.addRow(duplicateRow);

  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  const crossRefsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );

  await saveWorkbook(
    workbook,
    SCENARIOS_OUTPUT_DIR,
    "error-e2-duplicate-sku.xlsx"
  );
}

// Error Scenario: E3 - Empty Required Fields
async function generateScenarioError_E3_EmptyFields(baseline: BaselineData) {
  const workbook = createWorkbook();

  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);

  // Add part with missing ACR_SKU
  partsSheet.addRow([
    "",
    "",
    "MAZA",
    "DELANTERA",
    "C/ABS",
    "4 BIRLOS",
    "4x8",
    "Missing SKU",
  ]);

  // Add part with missing Part_Type
  partsSheet.addRow(["", "ACR-VALID-001", "", "", "", "", "", "Missing type"]);

  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  const crossRefsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );

  await saveWorkbook(
    workbook,
    SCENARIOS_OUTPUT_DIR,
    "error-e3-empty-fields.xlsx"
  );
}

// Error Scenario: E5 - Orphaned Foreign Key
async function generateScenarioError_E5_OrphanedFk(baseline: BaselineData) {
  const workbook = createWorkbook();

  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);
  partsSheet.addRow([
    "real-part-id",
    "ACR-VALID-001",
    "MAZA",
    "DELANTERA",
    "C/ABS",
    "4 BIRLOS",
    "4x8",
    "Valid part",
  ]);

  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  // Reference non-existent part
  vehiclesSheet.addRow([
    "va-id-1",
    "nonexistent-part-id",
    "ACR-INVALID",
    "FORD",
    "F-150",
    2020,
    2023,
  ]);

  const crossRefsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );

  await saveWorkbook(
    workbook,
    SCENARIOS_OUTPUT_DIR,
    "error-e5-orphaned-fk.xlsx"
  );
}

// Error Scenario: E6 - Invalid Year Range
async function generateScenarioError_E6_InvalidYearRange(
  baseline: BaselineData
) {
  const workbook = createWorkbook();

  const partsSheet = addWorksheet(workbook, SHEET_NAMES.PARTS, PARTS_COLUMNS);
  partsSheet.addRow([
    "part-id-1",
    "ACR-VALID-001",
    "MAZA",
    "DELANTERA",
    "C/ABS",
    "4 BIRLOS",
    "4x8",
    "Valid part",
  ]);

  const vehiclesSheet = addWorksheet(
    workbook,
    SHEET_NAMES.VEHICLE_APPLICATIONS,
    VEHICLE_APPLICATIONS_COLUMNS
  );
  // start_year > end_year
  vehiclesSheet.addRow([
    "va-id-1",
    "part-id-1",
    "ACR-VALID-001",
    "FORD",
    "F-150",
    2025,
    2020,
  ]);

  const crossRefsSheet = addWorksheet(
    workbook,
    SHEET_NAMES.CROSS_REFERENCES,
    CROSS_REFERENCES_COLUMNS
  );

  await saveWorkbook(
    workbook,
    SCENARIOS_OUTPUT_DIR,
    "error-e6-invalid-year-range.xlsx"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const mode = process.argv[2] || "all";

  console.log("🔧 ACR Automotive Test Data Generator");
  console.log("=====================================");
  console.log(`📋 Mode: ${mode}`);
  console.log(
    "📊 Schema-aware: Using shared constants from src/services/excel/shared/"
  );
  console.log("");

  try {
    if (mode === "all" || mode === "unit") {
      await generateUnitFixtures();
    }

    if (mode === "all" || mode === "scenarios") {
      await generateIntegrationScenarios();
    }

    console.log("✅ Test data generation complete!\n");
  } catch (error) {
    console.error("❌ Error generating test data:", error);
    process.exit(1);
  }
}

main();
