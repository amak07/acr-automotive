import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import {
  SHEET_NAMES,
  COLUMN_HEADERS,
  PARTS_COLUMNS,
  VEHICLE_APPLICATIONS_COLUMNS,
  ALIASES_COLUMNS,
  BRAND_COLUMN_MAP,
} from "../../src/services/excel/shared/constants";

/**
 * Phase 2: Admin Export E2E Tests
 *
 * Tests the /api/admin/export endpoint for correct workbook structure,
 * column headers, data integrity, and hidden ID columns.
 *
 * All tests call the API directly using authenticated request context
 * (storageState cookies from auth.setup.ts) and parse the response
 * with ExcelJS.
 */

// Seed data counts (from scripts/db/import-seed-sql.ts)
const EXPECTED_PARTS_COUNT = 865;

test.describe("Admin Export — Template Structure", () => {
  let workbook: ExcelJS.Workbook;

  test.beforeAll(async ({ request }) => {
    const response = await request.get("/api/admin/export");
    expect(response.status()).toBe(200);
    const body = await response.body();
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(body as unknown as ExcelJS.Buffer);
  });

  test("admin can download full catalog export", async ({ request }) => {
    const response = await request.get("/api/admin/export");
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const contentDisposition = response.headers()["content-disposition"];
    expect(contentDisposition).toContain("acr-catalog-export");
    expect(contentDisposition).toContain(".xlsx");
  });

  test("exported workbook has correct sheets", () => {
    const sheetNames = workbook.worksheets.map((ws) => ws.name);
    expect(sheetNames).toContain(SHEET_NAMES.PARTS);
    expect(sheetNames).toContain(SHEET_NAMES.VEHICLE_APPLICATIONS);
    expect(sheetNames).toContain(SHEET_NAMES.ALIASES);
    expect(sheetNames).toHaveLength(3);
  });

  test("Parts sheet has correct column headers in order", () => {
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    const headerRow = partsSheet.getRow(2);

    // Get expected headers from constants
    const expectedHeaders = PARTS_COLUMNS.map((col) => col.header);

    // Extract actual headers from Row 2
    const actualHeaders: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      actualHeaders.push(cell.value?.toString() || "");
    });

    expect(actualHeaders).toEqual(expectedHeaders);
  });

  test("Parts sheet has group header row", () => {
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    const row1 = partsSheet.getRow(1);

    // Row 1 should contain group headers: System, Part Information, Cross-References, Images
    const row1Values: string[] = [];
    row1.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value?.toString() || "";
      if (val && !row1Values.includes(val)) {
        row1Values.push(val);
      }
    });

    expect(row1Values).toContain("Part Information");
    expect(row1Values).toContain("Cross-References");
    expect(row1Values).toContain("Images");
  });

  test("Parts sheet has instruction row", () => {
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    const row3 = partsSheet.getRow(3);

    // Row 3 should have instruction text (Spanish locale by default)
    const instructionTexts: string[] = [];
    row3.eachCell({ includeEmpty: false }, (cell) => {
      instructionTexts.push(cell.value?.toString() || "");
    });

    // Should have instruction-like content
    expect(instructionTexts.length).toBeGreaterThan(0);
    // Check for known instruction phrases (export uses Spanish locale by default)
    const combined = instructionTexts.join(" ");
    expect(
      combined.includes("No modificar") ||
        combined.includes("Do not") ||
        combined.includes("ej.,") ||
        combined.includes("e.g.,")
    ).toBe(true);
  });

  test("Status column has data validation and Errors column exists", () => {
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    // Status column exists
    const statusColIdx =
      PARTS_COLUMNS.findIndex((col) => col.key === "status") + 1;
    expect(statusColIdx).toBeGreaterThan(0);

    // Errors column exists
    const errorsColIdx =
      PARTS_COLUMNS.findIndex((col) => col.key === "errors") + 1;
    expect(errorsColIdx).toBeGreaterThan(0);

    // Verify Status has data validation dropdown
    const cell = partsSheet.getCell(4, statusColIdx);
    expect(cell.dataValidation).toBeDefined();
    expect(cell.dataValidation!.type).toBe("list");
  });

  test("data row count matches database", () => {
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    // Data starts at Row 4 (after group headers, column headers, instructions)
    // rowCount includes all rows, subtract 3 header rows
    const dataRowCount = partsSheet.rowCount - 3;

    expect(dataRowCount).toBe(EXPECTED_PARTS_COUNT);
  });

  test("exported cross-references match database format", () => {
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    // Brand columns should exist
    const brandColumnNames = Object.values(BRAND_COLUMN_MAP);
    const headerRow = partsSheet.getRow(2);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(cell.value?.toString() || "");
    });

    // Verify brand column headers exist (National, ATV, SYD, etc.)
    for (const [, brandHeader] of Object.entries(COLUMN_HEADERS.PARTS)) {
      if (
        ["National", "ATV", "SYD", "TMK", "GROB", "RACE", "OEM", "OEM_2", "GMB", "GSP", "FAG"].includes(
          brandHeader as string
        )
      ) {
        expect(headers).toContain(brandHeader);
      }
    }

    // Spot-check: at least one data row should have semicolon-separated SKUs
    // in a brand column (seed data has cross-references)
    let foundCrossRef = false;
    for (let rowNum = 4; rowNum <= Math.min(partsSheet.rowCount, 50); rowNum++) {
      const row = partsSheet.getRow(rowNum);
      // Check National column (most likely to have data)
      const nationalColIdx = PARTS_COLUMNS.findIndex(
        (col) => col.key === "national_skus"
      );
      if (nationalColIdx >= 0) {
        const val = row.getCell(nationalColIdx + 1).value?.toString() || "";
        if (val.length > 0) {
          foundCrossRef = true;
          break;
        }
      }
    }
    expect(foundCrossRef).toBe(true);
  });
});

test.describe("Admin Export — Data Integrity", () => {
  let workbook: ExcelJS.Workbook;

  test.beforeAll(async ({ request }) => {
    const response = await request.get("/api/admin/export");
    expect(response.status()).toBe(200);
    const body = await response.body();
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(body as unknown as ExcelJS.Buffer);
  });

  test("exported vehicle applications sheet has data rows", () => {
    const vaSheet = workbook.getWorksheet(SHEET_NAMES.VEHICLE_APPLICATIONS)!;
    expect(vaSheet).toBeDefined();

    // Check correct column headers
    const headerRow = vaSheet.getRow(2);
    const expectedHeaders = VEHICLE_APPLICATIONS_COLUMNS.map(
      (col) => col.header
    );
    const actualHeaders: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      actualHeaders.push(cell.value?.toString() || "");
    });
    expect(actualHeaders).toEqual(expectedHeaders);

    // Data rows start at row 4 (3 header rows)
    const dataRowCount = vaSheet.rowCount - 3;
    expect(dataRowCount).toBeGreaterThan(0);
  });

  test("exported aliases sheet has data rows", () => {
    const aliasSheet = workbook.getWorksheet(SHEET_NAMES.ALIASES)!;
    expect(aliasSheet).toBeDefined();

    // Check correct column headers
    const headerRow = aliasSheet.getRow(2);
    const expectedHeaders = ALIASES_COLUMNS.map((col) => col.header);
    const actualHeaders: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      actualHeaders.push(cell.value?.toString() || "");
    });
    expect(actualHeaders).toEqual(expectedHeaders);

    // Data rows start at row 4 (3 header rows)
    const dataRowCount = aliasSheet.rowCount - 3;
    expect(dataRowCount).toBeGreaterThan(0);
  });

  test("Status column has data validation dropdown", () => {
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    // Find Status column index
    const statusColIdx =
      PARTS_COLUMNS.findIndex((col) => col.key === "status") + 1;
    expect(statusColIdx).toBeGreaterThan(0);

    // Check data validation on a data row (row 4)
    const cell = partsSheet.getCell(4, statusColIdx);
    expect(cell.dataValidation).toBeDefined();
    expect(cell.dataValidation!.type).toBe("list");
    expect(cell.dataValidation!.formulae![0]).toContain("Activo");
    expect(cell.dataValidation!.formulae![0]).toContain("Inactivo");
    expect(cell.dataValidation!.formulae![0]).toContain("Eliminar");
  });

  test("exported part types are valid", () => {
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    // Collect all unique part types from export
    const partTypeColIdx =
      PARTS_COLUMNS.findIndex((col) => col.key === "part_type") + 1;
    expect(partTypeColIdx).toBeGreaterThan(0);

    const partTypes = new Set<string>();
    for (let rowNum = 4; rowNum <= partsSheet.rowCount; rowNum++) {
      const val =
        partsSheet.getRow(rowNum).getCell(partTypeColIdx).value?.toString() ||
        "";
      if (val) partTypes.add(val);
    }

    // Should have some part types
    expect(partTypes.size).toBeGreaterThan(0);

    // Each should be a non-empty string (no null/undefined)
    for (const pt of partTypes) {
      expect(pt.trim().length).toBeGreaterThan(0);
    }
  });
});
