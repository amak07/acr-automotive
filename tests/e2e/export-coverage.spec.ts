import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import { SHEET_NAMES } from "./helpers/workbook-builder";
import { CATALOG_STATS } from "./fixtures/test-data";

/**
 * Export Coverage E2E Tests
 *
 * Tests export features that aren't covered by admin-import.spec.ts:
 * - Filtered export (with query params)
 * - Spanish locale export (column headers)
 * - Export data accuracy (row counts, cross-ref columns, image URLs)
 * - Export stats response headers
 *
 * Runs in the "chromium" project with admin storageState (read-only, no DB mutations).
 *
 * API route: src/app/api/admin/export/route.ts
 * Service: src/services/export/ExcelExportService.ts
 */

test.describe("Export Coverage", () => {
  // ---------------------------------------------------------------------------
  // Test 1: Filtered export returns subset
  // ---------------------------------------------------------------------------
  test("filtered export with part_type returns fewer rows than full export", async ({
    page,
  }) => {
    // Full export
    const fullResponse = await page.request.get("/api/admin/export");
    expect(fullResponse.status()).toBe(200);
    const fullParts = parseInt(
      fullResponse.headers()["x-export-parts"] || "0"
    );

    // Filtered export — only MAZA parts
    const filteredResponse = await page.request.get(
      "/api/admin/export?part_type=MAZA"
    );
    expect(filteredResponse.status()).toBe(200);

    // Verify response headers
    const contentType = filteredResponse.headers()["content-type"];
    expect(contentType).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Filename should contain "filtered"
    const disposition = filteredResponse.headers()["content-disposition"];
    expect(disposition).toContain("acr-filtered-export");

    // Filtered should have fewer or equal parts than full export
    const filteredParts = parseInt(
      filteredResponse.headers()["x-export-parts"] || "0"
    );
    expect(filteredParts).toBeLessThanOrEqual(fullParts);
    expect(filteredParts).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Test 2: Spanish locale export has Spanish column headers
  // ---------------------------------------------------------------------------
  test("Spanish locale export has Spanish column headers", async ({
    page,
  }) => {
    const response = await page.request.get("/api/admin/export?locale=es");
    expect(response.status()).toBe(200);

    const exportBuffer = await response.body();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exportBuffer.buffer as ArrayBuffer);

    // Parts sheet exists
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS);
    expect(partsSheet).toBeTruthy();

    // Row 2 = column headers — check for Spanish headers
    const headerRow = partsSheet!.getRow(2);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value || ""));
    });

    // Spanish column names (from constants.ts — PARTS_COLUMNS_ES)
    // "ACR SKU" stays the same, but "Part Type" → "Tipo de Parte"
    expect(headers).toContain("ACR SKU"); // Same in both languages
    expect(headers).toContain("Tipo de Parte"); // Spanish for "Part Type"
  });

  // ---------------------------------------------------------------------------
  // Test 3: Export data accuracy — row counts match DB
  // ---------------------------------------------------------------------------
  test("export data accuracy: parts count matches seed", async ({ page }) => {
    const response = await page.request.get("/api/admin/export");
    expect(response.status()).toBe(200);

    // Check stats headers
    const partsCount = parseInt(
      response.headers()["x-export-parts"] || "0"
    );
    const vehiclesCount = parseInt(
      response.headers()["x-export-vehicles"] || "0"
    );
    const crossRefsCount = parseInt(
      response.headers()["x-export-crossrefs"] || "0"
    );

    // Should match seed data (or close — import tests may add a few)
    expect(partsCount).toBeGreaterThanOrEqual(CATALOG_STATS.totalParts - 10);
    expect(vehiclesCount).toBeGreaterThan(0);
    expect(crossRefsCount).toBeGreaterThan(0);

    // Parse the actual workbook to verify row counts
    const exportBuffer = await response.body();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exportBuffer.buffer as ArrayBuffer);

    // Parts sheet: row 1 = group headers, row 2 = column headers, row 3 = instructions, data starts at row 4
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    const dataRows = partsSheet.rowCount - 3; // Subtract 3 header rows
    expect(dataRows).toBeGreaterThanOrEqual(CATALOG_STATS.totalParts - 10);
  });

  // ---------------------------------------------------------------------------
  // Test 4: Export contains cross-ref brand columns with data
  // ---------------------------------------------------------------------------
  test("export contains cross-ref brand columns with data", async ({
    page,
  }) => {
    const response = await page.request.get("/api/admin/export");
    expect(response.status()).toBe(200);

    const exportBuffer = await response.body();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exportBuffer.buffer as ArrayBuffer);

    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    const headerRow = partsSheet.getRow(2);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value || ""));
    });

    // Verify brand columns exist
    expect(headers).toContain("National");
    expect(headers).toContain("ATV");
    expect(headers).toContain("TMK");

    // Find the National column index and verify at least one row has data
    const nationalIdx =
      headers.indexOf("National") + 1; // ExcelJS is 1-indexed
    let hasNationalData = false;
    for (let row = 4; row <= Math.min(partsSheet.rowCount, 50); row++) {
      const cell = partsSheet.getRow(row).getCell(nationalIdx);
      if (cell.value && String(cell.value).trim() !== "") {
        hasNationalData = true;
        break;
      }
    }
    expect(hasNationalData).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Test 5: Export contains image URL columns
  // ---------------------------------------------------------------------------
  test("export contains image URL columns", async ({ page }) => {
    const response = await page.request.get("/api/admin/export");
    expect(response.status()).toBe(200);

    const exportBuffer = await response.body();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exportBuffer.buffer as ArrayBuffer);

    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    const headerRow = partsSheet.getRow(2);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value || ""));
    });

    // Image URL columns should exist
    expect(headers).toContain("Image URL Front");
  });

  // ---------------------------------------------------------------------------
  // Test 6: Export has 3 sheets with correct names
  // ---------------------------------------------------------------------------
  test("export has Vehicle Applications and Aliases sheets with data", async ({
    page,
  }) => {
    const response = await page.request.get("/api/admin/export");
    expect(response.status()).toBe(200);

    const exportBuffer = await response.body();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exportBuffer.buffer as ArrayBuffer);

    // Vehicle Applications sheet has data rows
    const vaSheet = workbook.getWorksheet(SHEET_NAMES.VEHICLE_APPLICATIONS)!;
    expect(vaSheet).toBeTruthy();
    expect(vaSheet.rowCount).toBeGreaterThan(3); // 3 header rows + data

    // Aliases sheet has data rows
    const aliasSheet = workbook.getWorksheet(SHEET_NAMES.ALIASES)!;
    expect(aliasSheet).toBeTruthy();
    expect(aliasSheet.rowCount).toBeGreaterThan(3);
  });
});
