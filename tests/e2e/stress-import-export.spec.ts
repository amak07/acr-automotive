/**
 * Import/Export Stress Tests
 *
 * Verifies the import/export pipelines handle large volumes reliably.
 * Tests 250-part imports with cross-refs and vehicle applications,
 * rollback after large imports, export row-count accuracy, and
 * export-to-re-import idempotency at full catalog scale.
 *
 * Runs in the `db-tests-stress` Playwright project (DB-mutating, serial, admin auth).
 */

import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import {
  createE2ESnapshot,
  restoreE2ESnapshot,
  deleteE2ESnapshot,
  cleanupE2EImports,
  getE2EClient,
} from "./helpers/db-helpers";
import { TestWorkbookBuilder } from "./helpers/workbook-builder";
import { CATALOG_STATS } from "./fixtures/test-data";

test.describe("Import/Export Stress Tests", () => {
  test.describe.configure({ mode: "serial" });

  let snapshotId: string;
  let importId: string;

  test.beforeAll(async () => {
    snapshotId = await createE2ESnapshot();
  });

  test.afterAll(async () => {
    await restoreE2ESnapshot(snapshotId);
    await deleteE2ESnapshot(snapshotId);
    await cleanupE2EImports();
  });

  // ---------------------------------------------------------------------------
  // Test 1: Import 250 new parts with cross-refs and VAs
  // ---------------------------------------------------------------------------
  test("import 250 new parts with cross-refs and VAs", async ({ page }) => {
    const builder = new TestWorkbookBuilder();
    const makes = ["TOYOTA", "HONDA", "FORD", "CHEVROLET", "NISSAN"];
    const models = ["CAMRY", "CIVIC", "F-150", "SILVERADO", "ALTIMA"];

    for (let i = 1; i <= 250; i++) {
      const sku = `ACRSTRESS${String(i).padStart(3, "0")}`;
      builder.addPartWithCrossRefs(
        { acr_sku: sku, part_type: "MAZA", status: "Activo" },
        { national: [`NAT-${sku}`], atv: [`ATV-${sku}`] }
      );
      // Add VA to every 3rd part
      if (i % 3 === 0) {
        const idx = i % 5;
        builder.addVehicleApp({
          acr_sku: sku,
          make: makes[idx],
          model: models[idx],
          start_year: 2020,
          end_year: 2024,
        });
      }
    }
    const buffer = await builder.toBuffer();

    // Preview
    const previewRes = await page.request.post("/api/admin/import/preview", {
      multipart: {
        file: {
          name: "stress-test-250.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          buffer,
        },
      },
      timeout: 120_000,
    });
    expect(previewRes.status()).toBe(200);
    const preview = await previewRes.json();
    expect(preview.valid).toBe(true);
    expect(preview.diff.summary.totalChanges).toBeGreaterThan(0);
    expect(preview.diff.parts.summary.totalAdds).toBe(250);
    expect(preview.diff.crossReferences.summary.totalAdds).toBe(500); // 2 per part
    expect(preview.diff.vehicleApplications.summary.totalAdds).toBe(83); // every 3rd of 250

    // Execute
    const execRes = await page.request.post("/api/admin/import/execute", {
      multipart: {
        file: {
          name: "stress-test-250.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          buffer,
        },
      },
      timeout: 120_000,
    });
    expect(execRes.status()).toBe(200);
    const execResult = await execRes.json();
    expect(execResult.success).toBe(true);
    expect(execResult.importId).toBeTruthy();

    // Store importId for rollback test
    importId = execResult.importId;

    // Spot-check: verify a stress part exists via public API
    const spotCheck = await page.request.get(
      "/api/public/parts?sku=ACRSTRESS125"
    );
    expect(spotCheck.status()).toBe(200);
    const spotData = await spotCheck.json();
    expect(spotData.success).toBe(true);
    expect(spotData.data.acr_sku).toBe("ACRSTRESS125");
  });

  // ---------------------------------------------------------------------------
  // Test 2: Rollback after large import restores DB
  // ---------------------------------------------------------------------------
  test("rollback after large import restores DB", async ({ page }) => {
    expect(importId).toBeTruthy();

    const rollbackRes = await page.request.post(
      "/api/admin/import/rollback",
      {
        data: { importId },
        timeout: 120_000,
      }
    );
    expect(rollbackRes.status()).toBe(200);
    const rollbackResult = await rollbackRes.json();
    expect(rollbackResult.success).toBe(true);

    // Verify stress parts are gone
    const spotCheck = await page.request.get(
      "/api/public/parts?sku=ACRSTRESS125"
    );
    expect(spotCheck.status()).toBe(404);

    // Verify total active parts are back to baseline
    const supabase = getE2EClient();
    const { count } = await supabase
      .from("parts")
      .select("id", { count: "exact", head: true })
      .eq("workflow_status", "ACTIVE");
    expect(count).toBe(CATALOG_STATS.activeParts);
  });

  // ---------------------------------------------------------------------------
  // Test 3: Full catalog export matches DB row count exactly
  // ---------------------------------------------------------------------------
  test("full catalog export matches DB row count exactly", async ({
    page,
  }) => {
    const exportRes = await page.request.get("/api/admin/export", {
      timeout: 120_000,
    });
    expect(exportRes.status()).toBe(200);

    const exportBuffer = await exportRes.body();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exportBuffer.buffer as ArrayBuffer);

    // Parts sheet: subtract 3 header rows
    const partsSheet = workbook.getWorksheet("Parts");
    expect(partsSheet).toBeTruthy();
    const dataRows = partsSheet!.rowCount - 3;

    // Query DB for exact total part count (export includes all parts, not just ACTIVE)
    const supabase = getE2EClient();
    const { count } = await supabase
      .from("parts")
      .select("id", { count: "exact", head: true });

    expect(dataRows).toBe(count);

    // Vehicle Applications sheet has data rows
    const vaSheet = workbook.getWorksheet("Vehicle Applications");
    expect(vaSheet).toBeTruthy();
    expect(vaSheet!.rowCount).toBeGreaterThan(3);

    // Vehicle Aliases sheet exists and has rows
    const aliasesSheet = workbook.getWorksheet("Vehicle Aliases");
    expect(aliasesSheet).toBeTruthy();
    expect(aliasesSheet!.rowCount).toBeGreaterThan(3);
  });

  // ---------------------------------------------------------------------------
  // Test 4: Export -> re-import round-trip shows no changes
  // ---------------------------------------------------------------------------
  test("export -> re-import round-trip shows no changes", async ({
    page,
  }) => {
    const exportRes = await page.request.get("/api/admin/export", {
      timeout: 120_000,
    });
    expect(exportRes.status()).toBe(200);
    const exportBuffer = await exportRes.body();

    const previewRes = await page.request.post("/api/admin/import/preview", {
      multipart: {
        file: {
          name: "round-trip-test.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          buffer: exportBuffer,
        },
      },
      timeout: 120_000,
    });
    expect(previewRes.status()).toBe(200);
    const preview = await previewRes.json();
    expect(preview.valid).toBe(true);
    expect(preview.diff.summary.totalChanges).toBe(0);
  });
});
