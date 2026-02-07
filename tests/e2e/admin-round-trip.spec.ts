import { test, expect, APIRequestContext } from "@playwright/test";
import ExcelJS from "exceljs";
import {
  SHEET_NAMES,
  COLUMN_HEADERS,
} from "../../src/services/excel/shared/constants";
import {
  getE2EClient,
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
  cleanupE2EImports,
} from "./helpers/db-helpers";

/**
 * Phase 4: Admin Round-Trip E2E Tests
 *
 * Tests the full cycle: export catalog -> modify workbook in-memory ->
 * re-import via API -> verify database state.
 *
 * All tests call the API directly using authenticated request context
 * (storageState cookies from auth.setup.ts) and parse responses with ExcelJS.
 */

// Describe blocks share database state via snapshots — must run serially
test.describe.configure({ mode: "serial" });

// Seed data counts (from scripts/db/import-seed-sql.ts)
const EXPECTED_PARTS_COUNT = 865;

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find a column number by its header text in Row 2.
 *
 * ExcelJS loses column key associations after `workbook.xlsx.load()`,
 * so we must locate columns by scanning the header row every time.
 */
function findColByHeader(
  worksheet: ExcelJS.Worksheet,
  headerText: string
): number {
  const row2 = worksheet.getRow(2);
  let colNum = -1;
  row2.eachCell({ includeEmpty: true }, (cell, num) => {
    if (cell.value?.toString() === headerText) {
      colNum = num;
    }
  });
  if (colNum === -1)
    throw new Error(`Header "${headerText}" not found in row 2`);
  return colNum;
}

/**
 * Export the full catalog and return an ExcelJS workbook + the raw buffer.
 */
async function exportCatalog(
  request: APIRequestContext
): Promise<{ workbook: ExcelJS.Workbook; buffer: Buffer }> {
  const response = await request.get("/api/admin/export");
  expect(response.status()).toBe(200);
  const body = await response.body();
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(body as any);
  return { workbook, buffer: body as any as Buffer };
}

/**
 * Convert an ExcelJS workbook back to a Buffer suitable for import upload.
 */
async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * Upload a buffer to the preview endpoint and return the parsed JSON body.
 */
async function previewImport(
  request: APIRequestContext,
  buffer: Buffer,
  fileName = "test-round-trip.xlsx"
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await request.post("/api/admin/import/preview", {
    multipart: {
      file: {
        name: fileName,
        mimeType: XLSX_MIME_TYPE,
        buffer,
      },
    },
  });
  const status = response.status();
  const body = (await response.json()) as Record<string, unknown>;
  return { status, body };
}

/**
 * Upload a buffer to the execute endpoint and return the parsed JSON body.
 */
async function executeImport(
  request: APIRequestContext,
  buffer: Buffer,
  fileName = "test-round-trip.xlsx"
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await request.post("/api/admin/import/execute", {
    multipart: {
      file: {
        name: fileName,
        mimeType: XLSX_MIME_TYPE,
        buffer,
      },
    },
  });
  const status = response.status();
  const body = (await response.json()) as Record<string, unknown>;
  return { status, body };
}

// ===========================================================================
// 1. Round-Trip -- No Modifications
// ===========================================================================

test.describe("Round-Trip — No Modifications", () => {
  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
    await cleanupE2EImports();
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint on re-import
  test.fixme("export then re-import with no changes shows zero diff", async ({
    request,
  }) => {
    // Export the full catalog
    const { buffer } = await exportCatalog(request);

    // Immediately re-import the unchanged buffer to the preview endpoint
    const { status, body } = await previewImport(request, buffer);

    expect(status).toBe(200);
    expect(body.valid).toBe(true);

    const diff = body.diff as Record<string, unknown>;
    expect(diff).toBeDefined();

    const summary = diff.summary as Record<string, number>;
    expect(summary.totalAdds).toBe(0);
    expect(summary.totalUpdates).toBe(0);
    expect(summary.totalDeletes).toBe(0);
    expect(summary.totalUnchanged).toBeGreaterThanOrEqual(EXPECTED_PARTS_COUNT);
  });

  test("export preserves ACR SKU and Status columns", async ({ request }) => {
    const { workbook } = await exportCatalog(request);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    expect(partsSheet).toBeDefined();

    // Find ACR SKU and Status columns via header scan
    const skuCol = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.ACR_SKU);
    const statusCol = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.STATUS);

    expect(skuCol).toBeGreaterThan(0);
    expect(statusCol).toBeGreaterThan(0);

    // Verify data rows (row 4+) contain ACR SKU values
    const skuRegex = /^ACR-/i;

    let skuCount = 0;
    const dataEnd = Math.min(partsSheet.rowCount, 20); // Spot-check first ~17 data rows
    for (let rowNum = 4; rowNum <= dataEnd; rowNum++) {
      const cellValue = partsSheet
        .getRow(rowNum)
        .getCell(skuCol)
        .value?.toString();
      if (cellValue && skuRegex.test(cellValue)) {
        skuCount++;
      }
    }

    // All checked data rows should have valid ACR SKUs
    expect(skuCount).toBe(dataEnd - 3); // dataEnd - 3 header rows
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint on re-import
  test.fixme("export header format is parseable by import", async ({ request }) => {
    // Export and immediately re-import to the preview/validate endpoint
    const { buffer } = await exportCatalog(request);
    const { status, body } = await previewImport(request, buffer);

    expect(status).toBe(200);
    expect(body.valid).toBe(true);

    // There should be no errors (warnings are acceptable, e.g. W6 for
    // vehicle app count mismatches in edge cases)
    const errors = body.errors as unknown[] | undefined;
    if (errors && errors.length > 0) {
      // If there are errors, they should NOT be validation-blocking errors
      // since the file came straight from the export endpoint
      expect(body.valid).toBe(true);
    }
  });
});

// ===========================================================================
// 2. Round-Trip -- CRUD Modifications
// ===========================================================================

test.describe("Round-Trip — CRUD Modifications", () => {
  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
    await cleanupE2EImports();
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint on full catalog re-import
  test.fixme("add new part to exported workbook", async ({ request }) => {
    const { workbook } = await exportCatalog(request);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    // Locate needed columns
    const acrSkuCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.ACR_SKU
    );
    const partTypeCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.PART_TYPE
    );
    const statusCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.STATUS
    );

    // Add a brand-new row (no _id, which signals an add)
    const newRow = partsSheet.addRow([]);
    newRow.getCell(acrSkuCol).value = "ACR-RT-NEW-001";
    newRow.getCell(partTypeCol).value = "MAZA";
    newRow.getCell(statusCol).value = "Activo";

    const modifiedBuffer = await workbookToBuffer(workbook);

    // Preview should detect 1 add
    const { status: previewStatus, body: previewBody } = await previewImport(
      request,
      modifiedBuffer
    );
    expect(previewStatus).toBe(200);
    expect(previewBody.valid).toBe(true);

    const diff = previewBody.diff as Record<string, unknown>;
    const partsDiff = diff.parts as Record<string, unknown>;
    const partsSummary = partsDiff.summary as Record<string, number>;
    expect(partsSummary.adds).toBeGreaterThanOrEqual(1);

    // Execute the import
    const { status: execStatus, body: execBody } = await executeImport(
      request,
      modifiedBuffer
    );
    expect(execStatus).toBe(200);
    expect(execBody.success).toBe(true);

    // Verify the new part exists in the database
    const supabase = getE2EClient();
    const { data: newPart } = await supabase
      .from("parts")
      .select("id, acr_sku, part_type")
      .eq("acr_sku", "ACR-RT-NEW-001")
      .single();

    expect(newPart).not.toBeNull();
    expect(newPart!.acr_sku).toBe("ACR-RT-NEW-001");
    expect(newPart!.part_type).toBe("MAZA");
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint on full catalog re-import
  test.fixme("modify existing part in exported workbook", async ({ request }) => {
    const { workbook } = await exportCatalog(request);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    const acrSkuCol = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.ACR_SKU);
    const specsCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.SPECIFICATIONS
    );

    // Pick the first data row (row 4) that has an ACR SKU
    const targetRow = partsSheet.getRow(4);
    const partSku = targetRow.getCell(acrSkuCol).value?.toString();
    expect(partSku).toBeTruthy();

    // Change the Specifications value to something unique
    const newSpec = `E2E-RT-MODIFIED-${Date.now()}`;
    targetRow.getCell(specsCol).value = newSpec;

    const modifiedBuffer = await workbookToBuffer(workbook);

    // Preview should detect at least 1 update
    const { status: previewStatus, body: previewBody } = await previewImport(
      request,
      modifiedBuffer
    );
    expect(previewStatus).toBe(200);
    expect(previewBody.valid).toBe(true);

    const diff = previewBody.diff as Record<string, unknown>;
    const partsDiff = diff.parts as Record<string, unknown>;
    const partsSummary = partsDiff.summary as Record<string, number>;
    expect(partsSummary.updates).toBeGreaterThanOrEqual(1);

    // Execute
    const { status: execStatus, body: execBody } = await executeImport(
      request,
      modifiedBuffer
    );
    expect(execStatus).toBe(200);
    expect(execBody.success).toBe(true);

    // Verify DB has the updated spec (match by SKU)
    const supabase = getE2EClient();
    const { data: updatedPart } = await supabase
      .from("parts")
      .select("specifications")
      .eq("acr_sku", partSku!)
      .single();

    expect(updatedPart).not.toBeNull();
    expect(updatedPart!.specifications).toBe(newSpec);
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint on full catalog re-import
  test.fixme("delete part via Status column", async ({ request }) => {
    const { workbook } = await exportCatalog(request);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    const acrSkuCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.ACR_SKU
    );
    const statusCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.STATUS
    );

    // Pick the last data row to minimize side-effects on other tests
    const lastDataRow = partsSheet.getRow(partsSheet.rowCount);
    const partSku = lastDataRow.getCell(acrSkuCol).value?.toString();
    expect(partSku).toBeTruthy();

    // Mark the row for deletion via Status column
    lastDataRow.getCell(statusCol).value = "Eliminar";

    const modifiedBuffer = await workbookToBuffer(workbook);

    // Preview should detect 1 delete
    const { status: previewStatus, body: previewBody } = await previewImport(
      request,
      modifiedBuffer
    );
    expect(previewStatus).toBe(200);
    expect(previewBody.valid).toBe(true);

    const diff = previewBody.diff as Record<string, unknown>;
    const partsDiff = diff.parts as Record<string, unknown>;
    const partsSummary = partsDiff.summary as Record<string, number>;
    expect(partsSummary.deletes).toBeGreaterThanOrEqual(1);

    // Execute the import
    const { status: execStatus, body: execBody } = await executeImport(
      request,
      modifiedBuffer
    );
    expect(execStatus).toBe(200);
    expect(execBody.success).toBe(true);

    // Verify the part is gone from the database
    const supabase = getE2EClient();
    const { data: deletedPart } = await supabase
      .from("parts")
      .select("id")
      .eq("acr_sku", partSku!)
      .maybeSingle();

    expect(deletedPart).toBeNull();
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint on full catalog re-import
  test.fixme("add cross-reference to existing part", async ({ request }) => {
    const { workbook } = await exportCatalog(request);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    const acrSkuCol = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.ACR_SKU);
    const nationalCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.NATIONAL_SKUS
    );

    // Find a data row that has an ACR SKU (row 4)
    const targetRow = partsSheet.getRow(4);
    const partSku = targetRow.getCell(acrSkuCol).value?.toString();
    expect(partSku).toBeTruthy();

    // Append a new cross-ref SKU to the National column
    const existingNational =
      targetRow.getCell(nationalCol).value?.toString() || "";
    const newSku = "NEWSKU-RT-001";
    const updatedValue = existingNational
      ? `${existingNational};${newSku}`
      : newSku;
    targetRow.getCell(nationalCol).value = updatedValue;

    const modifiedBuffer = await workbookToBuffer(workbook);

    // Preview should detect the update
    const { status: previewStatus, body: previewBody } = await previewImport(
      request,
      modifiedBuffer
    );
    expect(previewStatus).toBe(200);
    expect(previewBody.valid).toBe(true);

    const diff = previewBody.diff as Record<string, unknown>;
    const summary = diff.summary as Record<string, number>;
    // Should show at least 1 change (the cross-ref update counts as part update or CR change)
    expect(summary.totalChanges).toBeGreaterThanOrEqual(1);

    // Execute
    const { status: execStatus, body: execBody } = await executeImport(
      request,
      modifiedBuffer
    );
    expect(execStatus).toBe(200);
    expect(execBody.success).toBe(true);

    // Verify the new cross-reference exists in the database (look up part ID by SKU)
    const supabase = getE2EClient();
    const { data: part } = await supabase
      .from("parts")
      .select("id")
      .eq("acr_sku", partSku!)
      .single();
    expect(part).not.toBeNull();

    const { data: crossRefs } = await supabase
      .from("cross_references")
      .select("competitor_sku, competitor_brand")
      .eq("acr_part_id", part!.id)
      .eq("competitor_brand", "NATIONAL")
      .eq("competitor_sku", newSku);

    expect(crossRefs).not.toBeNull();
    expect(crossRefs!.length).toBeGreaterThanOrEqual(1);
    expect(crossRefs![0].competitor_sku).toBe(newSku);
  });
});

// ===========================================================================
// 3. Round-Trip -- Database Verification
// ===========================================================================

test.describe("Round-Trip — Database Verification", () => {
  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
    await cleanupE2EImports();
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint on full catalog re-import
  test.fixme("total parts count correct after round-trip CRUD", async ({
    request,
  }) => {
    const supabase = getE2EClient();

    // Confirm baseline count
    const { count: beforeCount } = await supabase
      .from("parts")
      .select("*", { count: "exact", head: true });
    expect(beforeCount).toBe(EXPECTED_PARTS_COUNT);

    // --- ADD a new part ---
    const { workbook: addWb } = await exportCatalog(request);
    const addSheet = addWb.getWorksheet(SHEET_NAMES.PARTS)!;
    const acrSkuCol = findColByHeader(addSheet, COLUMN_HEADERS.PARTS.ACR_SKU);
    const partTypeCol = findColByHeader(
      addSheet,
      COLUMN_HEADERS.PARTS.PART_TYPE
    );
    const statusCol = findColByHeader(addSheet, COLUMN_HEADERS.PARTS.STATUS);

    const addRow = addSheet.addRow([]);
    addRow.getCell(acrSkuCol).value = "ACR-RT-COUNT-ADD";
    addRow.getCell(partTypeCol).value = "MAZA";
    addRow.getCell(statusCol).value = "Activo";

    const addBuffer = await workbookToBuffer(addWb);
    const { status: addExecStatus, body: addExecBody } = await executeImport(
      request,
      addBuffer
    );
    expect(addExecStatus).toBe(200);
    expect(addExecBody.success).toBe(true);

    // --- DELETE one part ---
    const { workbook: delWb } = await exportCatalog(request);
    const delSheet = delWb.getWorksheet(SHEET_NAMES.PARTS)!;
    const delStatusCol = findColByHeader(
      delSheet,
      COLUMN_HEADERS.PARTS.STATUS
    );

    // Delete a data row (which is not the one we just added, to keep math simple)
    // Find a row that is NOT "ACR-RT-COUNT-ADD"
    const delAcrSkuCol = findColByHeader(
      delSheet,
      COLUMN_HEADERS.PARTS.ACR_SKU
    );
    let targetDeleteRow: ExcelJS.Row | null = null;
    for (let rowNum = 4; rowNum <= delSheet.rowCount; rowNum++) {
      const row = delSheet.getRow(rowNum);
      const sku = row.getCell(delAcrSkuCol).value?.toString() || "";
      if (sku && sku !== "ACR-RT-COUNT-ADD") {
        targetDeleteRow = row;
        break;
      }
    }
    expect(targetDeleteRow).not.toBeNull();
    targetDeleteRow!.getCell(delStatusCol).value = "Eliminar";

    const delBuffer = await workbookToBuffer(delWb);
    const { status: delExecStatus, body: delExecBody } = await executeImport(
      request,
      delBuffer
    );
    expect(delExecStatus).toBe(200);
    expect(delExecBody.success).toBe(true);

    // After adding 1 and deleting 1, count should be the same as original
    const { count: afterCount } = await supabase
      .from("parts")
      .select("*", { count: "exact", head: true });
    expect(afterCount).toBe(EXPECTED_PARTS_COUNT);
  });

  // BUG: acr-automotive-jm9 + acr-automotive-e6g — duplicate cross-ref + RLS on rollback
  test.fixme("rollback after round-trip restores original state", async ({
    request,
  }) => {
    const supabase = getE2EClient();

    // Capture counts before
    const { count: partsBefore } = await supabase
      .from("parts")
      .select("*", { count: "exact", head: true });
    const { count: crossRefsBefore } = await supabase
      .from("cross_references")
      .select("*", { count: "exact", head: true });

    // Perform an import that adds a part
    const { workbook } = await exportCatalog(request);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    const acrSkuCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.ACR_SKU
    );
    const partTypeCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.PART_TYPE
    );
    const statusCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.STATUS
    );

    const newRow = partsSheet.addRow([]);
    newRow.getCell(acrSkuCol).value = "ACR-RT-ROLLBACK-001";
    newRow.getCell(partTypeCol).value = "MAZA";
    newRow.getCell(statusCol).value = "Activo";

    const modifiedBuffer = await workbookToBuffer(workbook);
    const { status: execStatus, body: execBody } = await executeImport(
      request,
      modifiedBuffer
    );
    expect(execStatus).toBe(200);
    expect(execBody.success).toBe(true);

    const importId = execBody.importId as string;
    expect(importId).toBeTruthy();

    // Verify the new part exists
    const { data: addedPart } = await supabase
      .from("parts")
      .select("id")
      .eq("acr_sku", "ACR-RT-ROLLBACK-001")
      .maybeSingle();
    expect(addedPart).not.toBeNull();

    // Rollback
    const rollbackResponse = await request.post("/api/admin/import/rollback", {
      data: { importId },
    });
    expect(rollbackResponse.status()).toBe(200);
    const rollbackBody =
      (await rollbackResponse.json()) as Record<string, unknown>;
    expect(rollbackBody.success).toBe(true);

    // Verify counts match pre-import state
    const { count: partsAfterRollback } = await supabase
      .from("parts")
      .select("*", { count: "exact", head: true });
    const { count: crossRefsAfterRollback } = await supabase
      .from("cross_references")
      .select("*", { count: "exact", head: true });

    expect(partsAfterRollback).toBe(partsBefore);
    expect(crossRefsAfterRollback).toBe(crossRefsBefore);

    // Spot-check: the added part should be gone after rollback
    const { data: rolledBackPart } = await supabase
      .from("parts")
      .select("id")
      .eq("acr_sku", "ACR-RT-ROLLBACK-001")
      .maybeSingle();
    expect(rolledBackPart).toBeNull();
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint on full catalog re-import
  test.fixme("import history records round-trip import", async ({ request }) => {
    // Perform a round-trip import
    const { workbook } = await exportCatalog(request);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;
    const acrSkuCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.ACR_SKU
    );
    const partTypeCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.PART_TYPE
    );
    const statusCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.STATUS
    );

    const newRow = partsSheet.addRow([]);
    newRow.getCell(acrSkuCol).value = "ACR-RT-HISTORY-001";
    newRow.getCell(partTypeCol).value = "MAZA";
    newRow.getCell(statusCol).value = "Activo";

    const modifiedBuffer = await workbookToBuffer(workbook);
    const { body: execBody } = await executeImport(
      request,
      modifiedBuffer,
      "test-round-trip-history.xlsx"
    );
    expect(execBody.success).toBe(true);

    // Query import history
    const historyResponse = await request.get(
      "/api/admin/import/history?limit=5"
    );
    expect(historyResponse.status()).toBe(200);
    const historyBody =
      (await historyResponse.json()) as Record<string, unknown>;

    const historyData = historyBody.data as Array<Record<string, unknown>>;
    expect(historyData).toBeDefined();
    expect(historyData.length).toBeGreaterThanOrEqual(1);

    // The most recent entry should be our test import
    const latestEntry = historyData[0];
    expect(latestEntry.fileName).toBe("test-round-trip-history.xlsx");
    expect(latestEntry.hasSnapshot).toBe(true);

    // Import summary should contain counts
    const importSummary = latestEntry.importSummary as Record<string, unknown>;
    expect(importSummary).toBeDefined();
  });
});

// ===========================================================================
// 4. Round-Trip -- Image URL
// ===========================================================================

test.describe("Round-Trip — Image URL", () => {
  let snapshotId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
    await cleanupE2EImports();
  });

  test("exported workbook contains image URL columns", async ({ request }) => {
    const { workbook } = await exportCatalog(request);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    // Collect all headers from Row 2
    const headers: string[] = [];
    partsSheet.getRow(2).eachCell({ includeEmpty: false }, (cell) => {
      headers.push(cell.value?.toString() || "");
    });

    // Verify all image URL column headers exist
    expect(headers).toContain(COLUMN_HEADERS.PARTS.IMAGE_URL_FRONT);
    expect(headers).toContain(COLUMN_HEADERS.PARTS.IMAGE_URL_BACK);
    expect(headers).toContain(COLUMN_HEADERS.PARTS.IMAGE_URL_TOP);
    expect(headers).toContain(COLUMN_HEADERS.PARTS.IMAGE_URL_OTHER);

    // Spot-check: scan a few data rows for image URL values
    const frontCol = findColByHeader(
      partsSheet,
      COLUMN_HEADERS.PARTS.IMAGE_URL_FRONT
    );
    let hasImageUrl = false;
    for (
      let rowNum = 4;
      rowNum <= Math.min(partsSheet.rowCount, 100);
      rowNum++
    ) {
      const val =
        partsSheet.getRow(rowNum).getCell(frontCol).value?.toString() || "";
      if (val.length > 0) {
        hasImageUrl = true;
        break;
      }
    }

    // It is acceptable if seed data has no image URLs; this test just verifies
    // the columns exist. If images are present, that is a bonus.
    // We log but do not fail if no image URLs are found.
    if (!hasImageUrl) {
      // eslint-disable-next-line no-console
      console.log(
        "Note: No image URLs found in seed data (columns exist but are empty)"
      );
    }
  });

  // BUG: acr-automotive-jm9 — ImportService duplicate cross-ref constraint on full catalog re-import
  test.fixme("image URL columns survive no-change round-trip", async ({
    request,
  }) => {
    // First export: count parts with image URLs
    const { workbook: wb1 } = await exportCatalog(request);
    const sheet1 = wb1.getWorksheet(SHEET_NAMES.PARTS)!;

    const imageColumns = [
      COLUMN_HEADERS.PARTS.IMAGE_URL_FRONT,
      COLUMN_HEADERS.PARTS.IMAGE_URL_BACK,
      COLUMN_HEADERS.PARTS.IMAGE_URL_TOP,
      COLUMN_HEADERS.PARTS.IMAGE_URL_OTHER,
    ];

    // Count how many cells have image URLs across all image columns
    let imageCountBefore = 0;
    for (const colHeader of imageColumns) {
      let colNum: number;
      try {
        colNum = findColByHeader(sheet1, colHeader);
      } catch {
        continue; // Column not found, skip
      }
      for (let rowNum = 4; rowNum <= sheet1.rowCount; rowNum++) {
        const val =
          sheet1.getRow(rowNum).getCell(colNum).value?.toString() || "";
        if (val.length > 0) {
          imageCountBefore++;
        }
      }
    }

    // Re-import the unchanged workbook
    const buffer = await workbookToBuffer(wb1);
    const { status: execStatus, body: execBody } = await executeImport(
      request,
      buffer
    );
    expect(execStatus).toBe(200);
    expect(execBody.success).toBe(true);

    // Second export: count image URLs again
    const { workbook: wb2 } = await exportCatalog(request);
    const sheet2 = wb2.getWorksheet(SHEET_NAMES.PARTS)!;

    let imageCountAfter = 0;
    for (const colHeader of imageColumns) {
      let colNum: number;
      try {
        colNum = findColByHeader(sheet2, colHeader);
      } catch {
        continue;
      }
      for (let rowNum = 4; rowNum <= sheet2.rowCount; rowNum++) {
        const val =
          sheet2.getRow(rowNum).getCell(colNum).value?.toString() || "";
        if (val.length > 0) {
          imageCountAfter++;
        }
      }
    }

    // The image URL count must be the same after the round-trip
    expect(imageCountAfter).toBe(imageCountBefore);
  });
});
