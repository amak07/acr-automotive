/**
 * Generate Test Fixtures for Import/Rollback Pipeline
 *
 * Creates 10 Excel files covering all validation scenarios:
 * - Happy path (add, update, mixed)
 * - Validation errors (E1-E19)
 * - Validation warnings (W1-W10)
 * - Performance testing
 *
 * Usage:
 *   npm run test:generate-fixtures
 */

import * as fs from "fs";
import * as path from "path";
import * as ExcelJS from "exceljs";

const OUTPUT_DIR = path.join(process.cwd(), "fixtures", "excel");
const HIDDEN_ID_COLUMNS = ["_id", "_part_id", "_acr_part_id"];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create Excel workbook with proper structure and hidden ID columns
 */
function createWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ACR Automotive Test Suite";
  workbook.created = new Date();
  return workbook;
}

/**
 * Add worksheet with headers and hidden ID columns
 */
function addWorksheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: string[],
  idColumns: string[]
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(name);

  // Add all headers (visible + hidden)
  const allHeaders = [...idColumns, ...headers];
  sheet.addRow(allHeaders);

  // Hide ID columns
  idColumns.forEach((_, index) => {
    const column = sheet.getColumn(index + 1);
    column.hidden = true;
  });

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD3D3D3" },
  };

  return sheet;
}

/**
 * Save workbook to file
 */
async function saveWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const filepath = path.join(OUTPUT_DIR, filename);
  await workbook.xlsx.writeFile(filepath);
  console.log(`✅ Created: ${filename}`);
}

// ============================================================================
// Fixture 1: Valid Add New Parts
// ============================================================================

async function generateFixture1() {
  const workbook = createWorkbook();

  // Parts sheet
  const partsSheet = addWorksheet(
    workbook,
    "Parts",
    ["ACR_SKU", "Part_Type", "Position_Type", "ABS_Type", "Bolt_Pattern", "Drive_Type", "Specifications"],
    ["_id"]
  );

  const newParts = [
    ["", "NEW-001", "Rotor", "Front", "ABS", "5x114.3", "FWD", "Diameter: 310mm, Thickness: 28mm, Vented"],
    ["", "NEW-002", "Rotor", "Rear", "Non-ABS", "5x114.3", "RWD", "Diameter: 290mm, Thickness: 12mm, Solid"],
    ["", "NEW-003", "Pad Set", "Front", "ABS", null, null, "Ceramic, Low Dust"],
    ["", "NEW-004", "Pad Set", "Rear", "Non-ABS", null, null, "Semi-Metallic"],
    ["", "NEW-005", "Caliper", "Front Left", "ABS", null, null, "Remanufactured, 2-Piston"],
  ];

  newParts.forEach(part => partsSheet.addRow(part));

  // Vehicle Applications sheet
  const vehicleSheet = addWorksheet(
    workbook,
    "Vehicle Applications",
    ["ACR_SKU", "Make", "Model", "Start_Year", "End_Year"],
    ["_id", "_part_id"]
  );

  const vehicleApps = [
    ["", "", "NEW-001", "Honda", "Accord", 2013, 2017],
    ["", "", "NEW-001", "Honda", "Civic", 2012, 2015],
    ["", "", "NEW-002", "Toyota", "Camry", 2012, 2017],
    ["", "", "NEW-002", "Toyota", "RAV4", 2013, 2018],
    ["", "", "NEW-003", "Honda", "Accord", 2013, 2017],
    ["", "", "NEW-003", "Honda", "Civic", 2012, 2015],
    ["", "", "NEW-004", "Toyota", "Camry", 2012, 2017],
    ["", "", "NEW-004", "Toyota", "RAV4", 2013, 2018],
    ["", "", "NEW-005", "Honda", "Accord", 2013, 2017],
    ["", "", "NEW-005", "Honda", "Civic", 2012, 2015],
  ];

  vehicleApps.forEach(app => vehicleSheet.addRow(app));

  // Cross References sheet
  const crossRefSheet = addWorksheet(
    workbook,
    "Cross References",
    ["ACR_SKU", "Competitor_Brand", "Competitor_SKU"],
    ["_id", "_acr_part_id"]
  );

  const crossRefs = [
    ["", "", "NEW-001", "Brembo", "BR-09-C123"],
    ["", "", "NEW-001", "Raybestos", "RB-580999"],
    ["", "", "NEW-001", "Wagner", "WG-BD129999"],
    ["", "", "NEW-002", "Brembo", "BR-08-B456"],
    ["", "", "NEW-002", "Raybestos", "RB-580888"],
    ["", "", "NEW-002", "Wagner", "WG-BD128888"],
    ["", "", "NEW-003", "Wagner", "WG-TQ2000"],
    ["", "", "NEW-003", "Raybestos", "RB-MGD2000CH"],
    ["", "", "NEW-003", "Akebono", "AK-ACT2000"],
    ["", "", "NEW-004", "Wagner", "WG-ZX900"],
    ["", "", "NEW-004", "Raybestos", "RB-PGD900M"],
    ["", "", "NEW-004", "Akebono", "AK-ASP900"],
    ["", "", "NEW-005", "Cardone", "CA-18-B5000"],
    ["", "", "NEW-005", "Raybestos", "RB-FRC12000"],
    ["", "", "NEW-005", "ACDelco", "AC-18FR3000"],
  ];

  crossRefs.forEach(ref => crossRefSheet.addRow(ref));

  await saveWorkbook(workbook, "valid-add-new-parts.xlsx");
}

// ============================================================================
// Fixture 2: Valid Update Existing
// ============================================================================

async function generateFixture2() {
  const workbook = createWorkbook();

  // Parts sheet (update 3 existing parts from seed data)
  const partsSheet = addWorksheet(
    workbook,
    "Parts",
    ["ACR_SKU", "Part_Type", "Position_Type", "ABS_Type", "Bolt_Pattern", "Drive_Type", "Specifications"],
    ["_id"]
  );

  const updatedParts = [
    ["00000000-0000-0000-0000-000000000001", "SEED-001", "Rotor", "Front", "ABS", "5x114.3", "FWD", "UPDATED: Diameter: 300mm, Thickness: 28mm, High Performance Vented"],
    ["00000000-0000-0000-0000-000000000002", "SEED-002", "Rotor", "Rear", "Non-ABS", "5x114.3", "RWD", "UPDATED: Diameter: 280mm, Thickness: 12mm"],
    ["00000000-0000-0000-0000-000000000003", "SEED-003", "Rotor", "Front", "ABS", "5x100", "AWD", "UPDATED: Diameter: 320mm, High Performance"],
  ];

  updatedParts.forEach(part => partsSheet.addRow(part));

  // Empty vehicle apps and cross refs sheets (no changes)
  addWorksheet(workbook, "Vehicle Applications", ["ACR_SKU", "Make", "Model", "Start Year", "End Year"], ["_id", "_part_id"]);
  addWorksheet(workbook, "Cross References", ["ACR_SKU", "Competitor Brand", "Competitor SKU"], ["_id", "_acr_part_id"]);

  await saveWorkbook(workbook, "valid-update-existing.xlsx");
}

// ============================================================================
// Fixture 4: Error - Missing Required Fields
// ============================================================================

async function generateFixture4() {
  const workbook = createWorkbook();

  // Parts sheet with missing required fields
  const partsSheet = addWorksheet(
    workbook,
    "Parts",
    ["ACR_SKU", "Part_Type", "Position_Type", "ABS_Type", "Bolt_Pattern", "Drive_Type", "Specifications"],
    ["_id"]
  );

  const invalidParts = [
    ["", "VALID-001", "Rotor", "Front", "ABS", "5x114.3", "FWD", "Valid part"],
    ["", "", "Rotor", "Front", "ABS", "5x114.3", "FWD", "MISSING ACR_SKU"], // ERROR: E3
    ["", "VALID-002", "", "Front", "ABS", "5x114.3", "FWD", "MISSING Part Type"], // ERROR: E3
  ];

  invalidParts.forEach(part => partsSheet.addRow(part));

  // Vehicle apps with missing required fields
  const vehicleSheet = addWorksheet(
    workbook,
    "Vehicle Applications",
    ["ACR_SKU", "Make", "Model", "Start_Year", "End_Year"],
    ["_id", "_part_id"]
  );

  const invalidVehicles = [
    ["", "", "VALID-001", "Honda", "Accord", 2010, 2015],
    ["", "", "", "Honda", "Civic", 2010, 2015], // ERROR: E3 - Missing ACR_SKU
    ["", "", "VALID-001", "", "Accord", 2010, 2015], // ERROR: E3 - Missing Make
  ];

  invalidVehicles.forEach(app => vehicleSheet.addRow(app));

  // Cross refs with missing required fields
  const crossRefSheet = addWorksheet(
    workbook,
    "Cross References",
    ["ACR_SKU", "Competitor_Brand", "Competitor_SKU"],
    ["_id", "_acr_part_id"]
  );

  const invalidCrossRefs = [
    ["", "", "VALID-001", "Brembo", "BR-123"],
    ["", "", "VALID-001", "Raybestos", ""], // ERROR: E3 - Missing Competitor_SKU
  ];

  invalidCrossRefs.forEach(ref => crossRefSheet.addRow(ref));

  await saveWorkbook(workbook, "error-missing-required-fields.xlsx");
}

// ============================================================================
// Fixture 5: Error - Duplicate SKUs
// ============================================================================

async function generateFixture5() {
  const workbook = createWorkbook();

  // Parts sheet with duplicate ACR_SKU
  const partsSheet = addWorksheet(
    workbook,
    "Parts",
    ["ACR_SKU", "Part_Type", "Position_Type", "ABS_Type", "Bolt_Pattern", "Drive_Type", "Specifications"],
    ["_id"]
  );

  const duplicateParts = [
    ["", "DUP-001", "Rotor", "Front", "ABS", "5x114.3", "FWD", "First occurrence"],
    ["", "DUP-002", "Pad Set", "Front", "ABS", null, null, "Valid part"],
    ["", "DUP-001", "Rotor", "Rear", "Non-ABS", "5x114.3", "RWD", "DUPLICATE ACR_SKU"], // ERROR: E2
  ];

  duplicateParts.forEach(part => partsSheet.addRow(part));

  addWorksheet(workbook, "Vehicle Applications", ["ACR_SKU", "Make", "Model", "Start Year", "End Year"], ["_id", "_part_id"]);
  addWorksheet(workbook, "Cross References", ["ACR_SKU", "Competitor Brand", "Competitor SKU"], ["_id", "_acr_part_id"]);

  await saveWorkbook(workbook, "error-duplicate-skus.xlsx");
}

// ============================================================================
// Fixture 6: Error - Orphaned References
// ============================================================================

async function generateFixture6() {
  const workbook = createWorkbook();

  // Parts sheet
  const partsSheet = addWorksheet(
    workbook,
    "Parts",
    ["ACR_SKU", "Part_Type", "Position_Type", "ABS_Type", "Bolt_Pattern", "Drive_Type", "Specifications"],
    ["_id"]
  );

  partsSheet.addRow(["", "ORPHAN-001", "Rotor", "Front", "ABS", "5x114.3", "FWD", "Valid part"]);

  // Vehicle apps with orphaned reference
  const vehicleSheet = addWorksheet(
    workbook,
    "Vehicle Applications",
    ["ACR_SKU", "Make", "Model", "Start_Year", "End_Year"],
    ["_id", "_part_id"]
  );

  const vehicleApps = [
    ["", "", "ORPHAN-001", "Honda", "Accord", 2010, 2015],
    ["", "", "NON-EXISTENT-SKU", "Honda", "Civic", 2010, 2015], // ERROR: E5 - Orphaned FK
  ];

  vehicleApps.forEach(app => vehicleSheet.addRow(app));

  // Cross refs with orphaned reference
  const crossRefSheet = addWorksheet(
    workbook,
    "Cross References",
    ["ACR_SKU", "Competitor_Brand", "Competitor_SKU"],
    ["_id", "_acr_part_id"]
  );

  const crossRefs = [
    ["", "", "ORPHAN-001", "Brembo", "BR-123"],
    ["", "", "ANOTHER-NON-EXISTENT", "Raybestos", "RB-456"], // ERROR: E5 - Orphaned FK
  ];

  crossRefs.forEach(ref => crossRefSheet.addRow(ref));

  await saveWorkbook(workbook, "error-orphaned-references.xlsx");
}

// ============================================================================
// Fixture 7: Error - Invalid Formats
// ============================================================================

async function generateFixture7() {
  const workbook = createWorkbook();

  // Parts with invalid UUID
  const partsSheet = addWorksheet(
    workbook,
    "Parts",
    ["ACR_SKU", "Part_Type", "Position_Type", "ABS_Type", "Bolt_Pattern", "Drive_Type", "Specifications"],
    ["_id"]
  );

  const invalidParts = [
    ["", "FORMAT-001", "Rotor", "Front", "ABS", "5x114.3", "FWD", "Valid part"],
    ["not-a-uuid", "FORMAT-002", "Pad Set", "Front", "ABS", null, null, "INVALID UUID"], // ERROR: E4
  ];

  invalidParts.forEach(part => partsSheet.addRow(part));

  // Vehicle apps with invalid years
  const vehicleSheet = addWorksheet(
    workbook,
    "Vehicle Applications",
    ["ACR_SKU", "Make", "Model", "Start_Year", "End_Year"],
    ["_id", "_part_id"]
  );

  const invalidVehicles = [
    ["", "", "FORMAT-001", "Honda", "Accord", 2015, 2010], // ERROR: E6 - Inverted range
    ["", "", "FORMAT-001", "Honda", "Civic", 1850, 1900], // ERROR: E8 - Year out of range
    ["12345", "", "FORMAT-001", "Toyota", "Camry", 2010, 2015], // ERROR: E4 - Invalid UUID
  ];

  invalidVehicles.forEach(app => vehicleSheet.addRow(app));

  addWorksheet(workbook, "Cross References", ["ACR_SKU", "Competitor Brand", "Competitor SKU"], ["_id", "_acr_part_id"]);

  await saveWorkbook(workbook, "error-invalid-formats.xlsx");
}

// ============================================================================
// Fixture 8: Error - Max Length Exceeded
// ============================================================================

async function generateFixture8() {
  const workbook = createWorkbook();

  // Parts with string exceeding max length
  const partsSheet = addWorksheet(
    workbook,
    "Parts",
    ["ACR_SKU", "Part_Type", "Position_Type", "ABS_Type", "Bolt_Pattern", "Drive_Type", "Specifications"],
    ["_id"]
  );

  const longSku = "X".repeat(51); // Max is 50
  const longMake = "Y".repeat(51); // Max is 50

  const invalidParts = [
    ["", longSku, "Rotor", "Front", "ABS", "5x114.3", "FWD", "ACR_SKU TOO LONG"], // ERROR: E7
  ];

  invalidParts.forEach(part => partsSheet.addRow(part));

  // Vehicle apps with long make
  const vehicleSheet = addWorksheet(
    workbook,
    "Vehicle Applications",
    ["ACR_SKU", "Make", "Model", "Start_Year", "End_Year"],
    ["_id", "_part_id"]
  );

  const invalidVehicles = [
    ["", "", longSku, longMake, "Accord", 2010, 2015], // ERROR: E7 - Make too long (references the long SKU part)
  ];

  invalidVehicles.forEach(app => vehicleSheet.addRow(app));

  addWorksheet(workbook, "Cross References", ["ACR_SKU", "Competitor Brand", "Competitor SKU"], ["_id", "_acr_part_id"]);

  await saveWorkbook(workbook, "error-max-length-exceeded.xlsx");
}

// ============================================================================
// Fixture 9: Warning - Data Changes
// ============================================================================

async function generateFixture9() {
  const workbook = createWorkbook();

  // Parts with changes that trigger warnings
  const partsSheet = addWorksheet(
    workbook,
    "Parts",
    ["ACR_SKU", "Part_Type", "Position_Type", "ABS_Type", "Bolt_Pattern", "Drive_Type", "Specifications"],
    ["_id"]
  );

  const warningParts = [
    ["00000000-0000-0000-0000-000000000001", "SEED-001-CHANGED", "Rotor", "Front", "ABS", "5x114.3", "FWD", "Diameter: 300mm"], // WARNING: W1 - SKU changed
    ["00000000-0000-0000-0000-000000000002", "SEED-002", "Caliper", "Rear", "Non-ABS", "5x114.3", "RWD", "Diameter: 280mm"], // WARNING: W3 - Part Type changed
    ["00000000-0000-0000-0000-000000000003", "SEED-003", "Rotor", "Rear", "ABS", "5x100", "AWD", "Diameter: 320mm"], // WARNING: W4 - Position changed
    ["00000000-0000-0000-0000-000000000004", "SEED-004", "Pad Set", "Front", "ABS", null, null, "Short"], // WARNING: W7 - Specs shortened
  ];

  warningParts.forEach(part => partsSheet.addRow(part));

  // Vehicle apps with warnings
  const vehicleSheet = addWorksheet(
    workbook,
    "Vehicle Applications",
    ["ACR_SKU", "Make", "Model", "Start_Year", "End_Year"],
    ["_id", "_part_id"]
  );

  const warningVehicles = [
    ["10000000-0000-0000-0000-000000000001", "", "SEED-001", "Toyota", "Accord", 2010, 2012], // WARNING: W8 - Make changed
    ["10000000-0000-0000-0000-000000000002", "", "SEED-001", "Honda", "CR-V", 2010, 2011], // WARNING: W9 - Model changed
    ["10000000-0000-0000-0000-000000000003", "", "SEED-001", "Acura", "TSX", 2010, 2012], // WARNING: W2 - Year range narrowed
  ];

  warningVehicles.forEach(app => vehicleSheet.addRow(app));

  // Cross refs with warnings
  const crossRefSheet = addWorksheet(
    workbook,
    "Cross References",
    ["ACR_SKU", "Competitor_Brand", "Competitor_SKU"],
    ["_id", "_acr_part_id"]
  );

  const warningCrossRefs = [
    ["20000000-0000-0000-0000-000000000001", "", "SEED-001", "StopTech", "BR-09-A234"], // WARNING: W10 - Competitor brand changed
  ];

  warningCrossRefs.forEach(ref => crossRefSheet.addRow(ref));

  await saveWorkbook(workbook, "warning-data-changes.xlsx");
}

// ============================================================================
// Main Generator
// ============================================================================

async function generateAllFixtures() {
  console.log("🔧 Generating test fixtures...\n");
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);

  try {
    await generateFixture1();
    await generateFixture2();
    await generateFixture4();
    await generateFixture5();
    await generateFixture6();
    await generateFixture7();
    await generateFixture8();
    await generateFixture9();

    console.log("\n" + "═".repeat(80));
    console.log("✅ FIXTURE GENERATION COMPLETE\n");
    console.log("📋 Generated Fixtures:");
    console.log("   1. valid-add-new-parts.xlsx         - Add 5 new parts");
    console.log("   2. valid-update-existing.xlsx       - Update 3 existing parts");
    console.log("   4. error-missing-required-fields.xlsx - E3 errors");
    console.log("   5. error-duplicate-skus.xlsx        - E2 error");
    console.log("   6. error-orphaned-references.xlsx   - E5 errors");
    console.log("   7. error-invalid-formats.xlsx       - E4, E6, E8 errors");
    console.log("   8. error-max-length-exceeded.xlsx   - E7 errors");
    console.log("   9. warning-data-changes.xlsx        - W1-W10 warnings");
    console.log("");
    console.log("💡 Next Steps:");
    console.log("   1. Load seed data: npm run test:reset-db (manual SQL for now)");
    console.log("   2. Run validation tests: npm test validation-engine.test.ts");
    console.log("   3. Run integration tests: npm test scenarios/");
    console.log("═".repeat(80));
  } catch (error: any) {
    console.error("\n❌ Fixture generation failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateAllFixtures();
