/**
 * Import Pipeline Stress Tests
 *
 * Exports the real catalog, programmatically modifies the workbook,
 * uploads via API, and verifies results. Fixes production bugs as found.
 *
 * Prerequisites:
 *   - Local Supabase running (npx.cmd supabase start)
 *   - Dev server running (npm.cmd run dev)
 *   - Seeded DB (npm.cmd run db:import-seed)
 *
 * Usage:
 *   npx.cmd tsx scripts/stress-test-import.ts
 *   npx.cmd tsx scripts/stress-test-import.ts --test=1    # run single test
 */

import * as ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = "http://localhost:3000";
const SUPABASE_URL = "http://localhost:54321";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const ADMIN_EMAIL = "abel.mak@acr.com";
const ADMIN_PASSWORD = "acr2026admin";

// Service role client for direct DB verification
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Auth helper — sign in and produce the cookie Next.js SSR expects
// ---------------------------------------------------------------------------

async function getAuthCookie(): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (error || !data.session) {
    throw new Error(`Auth failed: ${error?.message ?? "no session"}`);
  }
  const sessionJson = JSON.stringify(data.session);
  const encoded = Buffer.from(sessionJson).toString("base64");
  return `sb-localhost-auth-token=base64-${encoded}`;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function exportCatalog(cookie: string): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/api/admin/export`, {
    headers: { cookie },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Export failed (${res.status}): ${text}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function bufferToFile(buffer: Buffer, filename: string): File {
  // Convert Node Buffer to Uint8Array to avoid TS Buffer/BlobPart mismatch
  const uint8 = new Uint8Array(buffer);
  return new File([uint8], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function previewImport(
  cookie: string,
  buffer: Buffer,
  filename = "stress-test.xlsx"
): Promise<any> {
  const formData = new FormData();
  formData.append("file", bufferToFile(buffer, filename));
  const res = await fetch(`${BASE_URL}/api/admin/import/preview`, {
    method: "POST",
    headers: { cookie },
    body: formData,
  });
  return res.json();
}

async function executeImport(
  cookie: string,
  buffer: Buffer,
  filename = "stress-test.xlsx"
): Promise<any> {
  const formData = new FormData();
  formData.append("file", bufferToFile(buffer, filename));
  const res = await fetch(`${BASE_URL}/api/admin/import/execute`, {
    method: "POST",
    headers: { cookie },
    body: formData,
  });
  return res.json();
}

async function rollbackImport(
  cookie: string,
  importId: string
): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/admin/import/rollback`, {
    method: "POST",
    headers: { cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ importId }),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// DB verification helpers (service role — bypasses RLS)
// ---------------------------------------------------------------------------

async function countParts(): Promise<number> {
  const { count } = await db
    .from("parts")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function countCrossRefs(): Promise<number> {
  const { count } = await db
    .from("cross_references")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function countVehicleApps(): Promise<number> {
  const { count } = await db
    .from("vehicle_applications")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function findPartBySku(sku: string) {
  const { data } = await db
    .from("parts")
    .select("*")
    .eq("acr_sku", sku)
    .maybeSingle();
  return data;
}

async function findCrossRefsByPartId(partId: string) {
  const { data } = await db
    .from("cross_references")
    .select("*")
    .eq("acr_part_id", partId);
  return data ?? [];
}

async function deleteStressTestParts(): Promise<number> {
  const { data } = await db
    .from("parts")
    .delete()
    .like("acr_sku", "ACR-STRESS-%")
    .select("id");
  return data?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Workbook manipulation helpers
// ---------------------------------------------------------------------------

/** Load an ExcelJS workbook from a buffer */
async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  return wb;
}

/** Save an ExcelJS workbook to a buffer */
async function saveWorkbook(wb: ExcelJS.Workbook): Promise<Buffer> {
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Get the Parts worksheet (first sheet) */
function getPartsSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet {
  const ws = wb.getWorksheet("Parts");
  if (!ws) throw new Error("No Parts worksheet found");
  return ws;
}

/** Get the Vehicle Applications worksheet */
function getVehicleAppsSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet {
  const ws = wb.getWorksheet("Vehicle Applications");
  if (!ws) throw new Error("No Vehicle Applications worksheet found");
  return ws;
}

/**
 * Find the column index for a header name on the Parts sheet.
 * Headers are in row 2 (row 1 = group headers, row 3 = instructions).
 */
function findColumn(ws: ExcelJS.Worksheet, headerName: string): number {
  const headerRow = ws.getRow(2);
  for (let col = 1; col <= ws.columnCount; col++) {
    const val = String(headerRow.getCell(col).value ?? "").trim();
    if (val.toLowerCase() === headerName.toLowerCase()) return col;
  }
  throw new Error(`Column "${headerName}" not found in headers`);
}

/** Get number of data rows (rows 4+) */
function dataRowCount(ws: ExcelJS.Worksheet): number {
  let count = 0;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) count++;
  });
  return count;
}

// ---------------------------------------------------------------------------
// Test runner infrastructure
// ---------------------------------------------------------------------------

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  fn: () => Promise<void>
): Promise<boolean> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, details: "OK", duration });
    console.log(`  PASS (${duration}ms)\n`);
    return true;
  } catch (err: any) {
    const duration = Date.now() - start;
    const details = err.message ?? String(err);
    results.push({ name, passed: false, details, duration });
    console.log(`  FAIL: ${details} (${duration}ms)\n`);
    return false;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual(actual: any, expected: any, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

// ---------------------------------------------------------------------------
// STRESS TESTS
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(70));
  console.log("  Import Pipeline Stress Tests");
  console.log("=".repeat(70));
  console.log("");

  // Parse --test=N argument
  const testArg = process.argv.find((a) => a.startsWith("--test="));
  const onlyTest = testArg ? parseInt(testArg.split("=")[1], 10) : null;

  // ---- Prerequisites ----
  console.log("Checking prerequisites...");
  try {
    const res = await fetch(BASE_URL, { redirect: "manual" });
    assert(
      res.status < 500,
      `Dev server not responding (status ${res.status})`
    );
    console.log("  Dev server: OK");
  } catch {
    console.log("  Dev server: NOT RUNNING");
    console.log("  Start with: npm.cmd run dev");
    process.exit(1);
  }

  try {
    const { count } = await db
      .from("parts")
      .select("*", { count: "exact", head: true });
    console.log(`  Supabase: OK (${count} parts)`);
  } catch {
    console.log("  Supabase: NOT RUNNING");
    console.log("  Start with: npx.cmd supabase start");
    process.exit(1);
  }

  // ---- Auth ----
  console.log("  Authenticating...");
  const cookie = await getAuthCookie();
  console.log("  Auth: OK\n");

  // ---- Baseline export ----
  console.log("Exporting baseline catalog...");
  const baselineBuffer = await exportCatalog(cookie);
  const baselineWb = await loadWorkbook(baselineBuffer);
  const baselinePartsSheet = getPartsSheet(baselineWb);
  const baselineDataRows = dataRowCount(baselinePartsSheet);
  console.log(
    `  Baseline: ${baselineDataRows} data rows, ${baselineBuffer.length} bytes\n`
  );

  // Capture baseline counts
  const baselineCounts = {
    parts: await countParts(),
    crossRefs: await countCrossRefs(),
    vehicleApps: await countVehicleApps(),
  };
  console.log(
    `  DB baseline: ${baselineCounts.parts} parts, ${baselineCounts.crossRefs} cross-refs, ${baselineCounts.vehicleApps} vehicle apps\n`
  );

  // Helper: restore baseline by re-importing the original export
  async function restoreBaseline() {
    console.log("  Restoring baseline...");
    const result = await executeImport(cookie, baselineBuffer);
    if (!result.success) {
      console.log("  WARNING: Baseline restore failed:", result);
    }
    // Also clean up any stress test parts
    const deleted = await deleteStressTestParts();
    if (deleted > 0) console.log(`  Cleaned up ${deleted} stress test parts`);
  }

  // ====================================================================
  // Test 1: Identity Round-Trip
  // ====================================================================

  const shouldRun = (n: number) => onlyTest === null || onlyTest === n;

  if (shouldRun(1)) {
    console.log("--- Test 1: Identity Round-Trip ---");
    const test1Passed = await runTest(
      "1. Identity Round-Trip (export -> preview unchanged)",
      async () => {
        const result = await previewImport(cookie, baselineBuffer);

        console.log(
          `  Response valid: ${result.valid}, errors: ${result.errors?.length ?? 0}`
        );

        if (result.diff?.summary) {
          const s = result.diff.summary;
          console.log(
            `  Summary: adds=${s.totalAdds} updates=${s.totalUpdates} deletes=${s.totalDeletes} unchanged=${s.totalUnchanged}`
          );

          // Log update details to find root cause
          if (result.diff.parts?.updates?.length > 0) {
            console.log(
              `  Part updates (unexpected): ${result.diff.parts.updates.length}`
            );
            for (const upd of result.diff.parts.updates.slice(0, 3)) {
              console.log(
                `    UPDATE: sku=${upd.row?.acr_sku ?? upd.after?.acr_sku} changes=${JSON.stringify(upd.changes)}`
              );
              if (upd.before && upd.after) {
                for (const field of (upd.changes || []).slice(0, 3)) {
                  console.log(
                    `      ${field}: before=${JSON.stringify((upd.before as any)[field])} after=${JSON.stringify((upd.after as any)[field])}`
                  );
                }
              }
            }
          }

          // Log cross-ref details if there are unexpected adds
          if (result.diff.crossReferences?.adds?.length > 0) {
            console.log(
              `  Cross-ref adds (unexpected): ${result.diff.crossReferences.adds.length}`
            );
            for (const add of result.diff.crossReferences.adds.slice(0, 5)) {
              const row = add.row || add.after || add;
              console.log(
                `    ADD: brand=${row.competitor_brand} sku="${row.competitor_sku}" part=${row._acr_part_id}`
              );
            }
          }
        } else {
          console.log("  Response:", JSON.stringify(result, null, 2));
        }

        // Collect all failures before asserting
        const failures: string[] = [];
        if (result.valid !== true) failures.push("preview should be valid");
        if (result.diff?.summary?.totalAdds !== 0)
          failures.push(
            `totalAdds: expected 0, got ${result.diff?.summary?.totalAdds}`
          );
        if (result.diff?.summary?.totalUpdates !== 0)
          failures.push(
            `totalUpdates: expected 0, got ${result.diff?.summary?.totalUpdates}`
          );
        if (result.diff?.summary?.totalDeletes !== 0)
          failures.push(
            `totalDeletes: expected 0, got ${result.diff?.summary?.totalDeletes}`
          );
        if (failures.length > 0) {
          throw new Error(failures.join("; "));
        }
      }
    );

    if (!test1Passed && onlyTest === null) {
      console.log(
        "Test 1 FAILED — this is the gate. Fix bugs before continuing.\n"
      );
      printSummary();
      process.exit(1);
    }
  }

  // ====================================================================
  // Test 2: Add 1 New Part (no cross-refs)
  // ====================================================================

  if (shouldRun(2)) {
    console.log("--- Test 2: Add 1 New Part (no cross-refs) ---");
    await runTest("2. Add new part (no cross-refs)", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);
      const newRow = dataRowCount(ws) + 4; // Append after last data row

      const colSku = findColumn(ws, "ACR SKU");
      const colType = findColumn(ws, "Part Type");
      const colPosition = findColumn(ws, "Position");

      ws.getRow(newRow).getCell(colSku).value = "ACR-STRESS-001";
      ws.getRow(newRow).getCell(colType).value = "Brake Rotor";
      ws.getRow(newRow).getCell(colPosition).value = "Front";

      const buffer = await saveWorkbook(wb);

      // Preview
      const preview = await previewImport(cookie, buffer);
      console.log(
        `  Preview: valid=${preview.valid} adds=${preview.diff?.summary?.totalAdds}`
      );
      if (!preview.valid) {
        console.log(`  Errors:`, JSON.stringify(preview.errors?.slice(0, 5), null, 2));
        console.log(`  Warnings:`, JSON.stringify(preview.warnings?.slice(0, 5), null, 2));
      }
      assert(preview.valid === true, `should be valid: ${preview.errors?.[0]?.message ?? JSON.stringify(preview.errors?.[0])}`);
      assert(
        preview.diff?.parts?.adds?.length >= 1,
        "should have at least 1 part add"
      );

      // Execute
      const exec = await executeImport(cookie, buffer);
      console.log(
        `  Execute: success=${exec.success} importId=${exec.importId}`
      );
      if (!exec.success) {
        console.log(`  Execute error:`, JSON.stringify(exec, null, 2));
      }
      assert(exec.success === true, `execute should succeed: ${exec.error ?? JSON.stringify(exec)}`);

      // Verify in DB
      const part = await findPartBySku("ACR-STRESS-001");
      assert(part !== null, "ACR-STRESS-001 should exist in DB");
      console.log(`  DB verify: found part ${part.id}`);

      // Restore
      await restoreBaseline();
      const after = await countParts();
      assertEqual(after, baselineCounts.parts, "parts count after restore");
    });
  }

  // ====================================================================
  // Test 3: Add 1 New Part WITH Cross-Refs
  // ====================================================================

  if (shouldRun(3)) {
    console.log("--- Test 3: Add 1 New Part WITH Cross-Refs ---");
    await runTest("3. Add new part with cross-refs", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);
      const newRow = dataRowCount(ws) + 4;

      const colSku = findColumn(ws, "ACR SKU");
      const colType = findColumn(ws, "Part Type");
      const colPosition = findColumn(ws, "Position");
      const colNational = findColumn(ws, "National");
      const colFag = findColumn(ws, "FAG");

      ws.getRow(newRow).getCell(colSku).value = "ACR-STRESS-002";
      ws.getRow(newRow).getCell(colType).value = "Brake Rotor";
      ws.getRow(newRow).getCell(colPosition).value = "Front";
      ws.getRow(newRow).getCell(colNational).value = "STRESS-NAT-001";
      ws.getRow(newRow).getCell(colFag).value = "STRESS-FAG-001";

      const buffer = await saveWorkbook(wb);

      // Preview
      const preview = await previewImport(cookie, buffer);
      console.log(
        `  Preview: valid=${preview.valid} partAdds=${preview.diff?.parts?.adds?.length} crossRefAdds=${preview.diff?.crossReferences?.adds?.length}`
      );
      assert(preview.valid === true, "should be valid");
      assert(preview.diff?.parts?.adds?.length >= 1, "should have part add");

      // Execute
      const exec = await executeImport(cookie, buffer);
      console.log(`  Execute: success=${exec.success}`);
      assert(exec.success === true, "execute should succeed");

      // Verify part
      const part = await findPartBySku("ACR-STRESS-002");
      assert(part !== null, "ACR-STRESS-002 should exist");

      // Verify cross-refs
      if (part) {
        const xrefs = await findCrossRefsByPartId(part.id);
        console.log(`  Cross-refs found: ${xrefs.length}`);
        const natRef = xrefs.find(
          (x: any) => x.competitor_sku === "STRESS-NAT-001"
        );
        const fagRef = xrefs.find(
          (x: any) => x.competitor_sku === "STRESS-FAG-001"
        );
        assert(natRef !== undefined, "National cross-ref should exist");
        assert(fagRef !== undefined, "FAG cross-ref should exist");
      }

      // Restore
      await restoreBaseline();
    });
  }

  // ====================================================================
  // Test 4: Update 1 Existing Part
  // ====================================================================

  if (shouldRun(4)) {
    console.log("--- Test 4: Update 1 Existing Part ---");
    await runTest("4. Update existing part", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);

      const colSpecs = findColumn(ws, "Specifications");
      const colId = findColumn(ws, "_id");

      // Modify row 4 (first data row) specifications
      const origSpecs = ws.getRow(4).getCell(colSpecs).value;
      const partId = String(ws.getRow(4).getCell(colId).value);
      const newSpecs = "STRESS-TEST-UPDATED-SPECS";
      ws.getRow(4).getCell(colSpecs).value = newSpecs;

      console.log(
        `  Modifying row 4 (part ${partId}): specs "${origSpecs}" -> "${newSpecs}"`
      );

      const buffer = await saveWorkbook(wb);

      // Preview
      const preview = await previewImport(cookie, buffer);
      console.log(
        `  Preview: valid=${preview.valid} updates=${preview.diff?.summary?.totalUpdates}`
      );
      assert(preview.valid === true, "should be valid");
      assert(
        preview.diff?.parts?.updates?.length >= 1,
        "should have part update"
      );

      // Execute
      const exec = await executeImport(cookie, buffer);
      assert(exec.success === true, "execute should succeed");

      // Verify
      const { data: part } = await db
        .from("parts")
        .select("specifications")
        .eq("id", partId)
        .single();
      assertEqual(part?.specifications, newSpecs, "specifications in DB");

      // Restore
      await restoreBaseline();
    });
  }

  // ====================================================================
  // Test 5: Delete 1 Part via _action=DELETE
  // ====================================================================

  if (shouldRun(5)) {
    console.log("--- Test 5: Delete via _action=DELETE ---");
    await runTest("5. Delete part via _action", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);

      const colAction = findColumn(ws, "_action");
      const colId = findColumn(ws, "_id");
      const colSku = findColumn(ws, "ACR SKU");

      // Mark row 4 for deletion
      const partId = String(ws.getRow(4).getCell(colId).value);
      const partSku = String(ws.getRow(4).getCell(colSku).value);
      ws.getRow(4).getCell(colAction).value = "DELETE";

      console.log(`  Marking row 4 for deletion: ${partSku} (${partId})`);

      const buffer = await saveWorkbook(wb);

      // Preview
      const preview = await previewImport(cookie, buffer);
      console.log(
        `  Preview: valid=${preview.valid} deletes=${preview.diff?.summary?.totalDeletes}`
      );
      assert(preview.valid === true, "should be valid");
      assert(
        preview.diff?.parts?.deletes?.length >= 1,
        "should have part delete"
      );

      // Execute
      const exec = await executeImport(cookie, buffer);
      assert(exec.success === true, "execute should succeed");

      // Verify part gone
      const after = await countParts();
      assertEqual(
        after,
        baselineCounts.parts - 1,
        "parts count should decrease by 1"
      );

      // Restore
      await restoreBaseline();
      const restored = await countParts();
      assertEqual(restored, baselineCounts.parts, "parts restored");
    });
  }

  // ====================================================================
  // Test 6: Add Cross-Ref to Existing Part
  // ====================================================================

  if (shouldRun(6)) {
    console.log("--- Test 6: Add Cross-Ref to Existing Part ---");
    await runTest("6. Add cross-ref to existing part", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);

      const colNational = findColumn(ws, "National");
      const colId = findColumn(ws, "_id");

      // Find a row with existing National cross-refs
      let targetRow = 0;
      let existingVal = "";
      for (let r = 4; r <= dataRowCount(ws) + 3; r++) {
        const val = String(ws.getRow(r).getCell(colNational).value ?? "");
        if (val.length > 0) {
          targetRow = r;
          existingVal = val;
          break;
        }
      }
      assert(targetRow > 0, "should find a row with National cross-refs");

      const partId = String(ws.getRow(targetRow).getCell(colId).value);
      const newVal = `${existingVal};STRESS-XREF-001`;
      ws.getRow(targetRow).getCell(colNational).value = newVal;
      console.log(
        `  Row ${targetRow}: National "${existingVal}" -> "${newVal}"`
      );

      const buffer = await saveWorkbook(wb);

      // Preview
      const preview = await previewImport(cookie, buffer);
      console.log(
        `  Preview: valid=${preview.valid} crossRefAdds=${preview.diff?.crossReferences?.adds?.length}`
      );
      assert(preview.valid === true, "should be valid");
      assert(
        preview.diff?.crossReferences?.adds?.length >= 1,
        "should have cross-ref add"
      );

      // Execute
      const exec = await executeImport(cookie, buffer);
      assert(exec.success === true, "execute should succeed");

      // Verify
      const xrefs = await findCrossRefsByPartId(partId);
      const found = xrefs.find(
        (x: any) => x.competitor_sku === "STRESS-XREF-001"
      );
      assert(found !== undefined, "STRESS-XREF-001 should exist in DB");

      // Restore
      await restoreBaseline();
    });
  }

  // ====================================================================
  // Test 7: Delete Cross-Ref via [DELETE] Marker
  // ====================================================================

  if (shouldRun(7)) {
    console.log("--- Test 7: Delete Cross-Ref via [DELETE] Marker ---");
    await runTest("7. Delete cross-ref via [DELETE] marker", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);

      const colNational = findColumn(ws, "National");
      const colId = findColumn(ws, "_id");

      // Find a row with National cross-refs containing at least 1 SKU
      let targetRow = 0;
      let existingVal = "";
      for (let r = 4; r <= dataRowCount(ws) + 3; r++) {
        const val = String(ws.getRow(r).getCell(colNational).value ?? "");
        if (val.length > 0 && !val.startsWith("[DELETE]")) {
          targetRow = r;
          existingVal = val;
          break;
        }
      }
      assert(targetRow > 0, "should find a row with National cross-refs");

      // Split the SKUs and mark the first one for deletion
      const skus = existingVal.split(";").map((s: string) => s.trim());
      const skuToDelete = skus[0];
      skus[0] = `[DELETE]${skuToDelete}`;
      const newVal = skus.join(";");

      const partId = String(ws.getRow(targetRow).getCell(colId).value);
      ws.getRow(targetRow).getCell(colNational).value = newVal;
      console.log(`  Row ${targetRow}: National "${existingVal}" -> "${newVal}"`);
      console.log(`  Deleting SKU: ${skuToDelete}`);

      const buffer = await saveWorkbook(wb);

      // Preview
      const preview = await previewImport(cookie, buffer);
      console.log(
        `  Preview: valid=${preview.valid} crossRefDeletes=${preview.diff?.crossReferences?.deletes?.length}`
      );
      assert(preview.valid === true, "should be valid");
      assert(
        preview.diff?.crossReferences?.deletes?.length >= 1,
        "should have cross-ref delete"
      );

      // Execute
      const exec = await executeImport(cookie, buffer);
      assert(exec.success === true, "execute should succeed");

      // Verify SKU is gone
      const xrefs = await findCrossRefsByPartId(partId);
      const found = xrefs.find(
        (x: any) => x.competitor_sku === skuToDelete
      );
      assert(found === undefined, `${skuToDelete} should be deleted from DB`);

      // Restore
      await restoreBaseline();
    });
  }

  // ====================================================================
  // Test 8: Mixed CRUD Operations
  // ====================================================================

  if (shouldRun(8)) {
    console.log("--- Test 8: Mixed CRUD Operations ---");
    await runTest("8. Mixed CRUD in one file", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);

      const colSku = findColumn(ws, "ACR SKU");
      const colType = findColumn(ws, "Part Type");
      const colPosition = findColumn(ws, "Position");
      const colAction = findColumn(ws, "_action");
      const colId = findColumn(ws, "_id");
      const colSpecs = findColumn(ws, "Specifications");
      const colNational = findColumn(ws, "National");

      // 1. Add a new part with cross-refs
      const newRow = dataRowCount(ws) + 4;
      ws.getRow(newRow).getCell(colSku).value = "ACR-STRESS-MIX-001";
      ws.getRow(newRow).getCell(colType).value = "Brake Rotor";
      ws.getRow(newRow).getCell(colPosition).value = "Front";
      ws.getRow(newRow).getCell(colNational).value = "STRESS-MIX-NAT-001";

      // 2. Update row 4 specs
      ws.getRow(4).getCell(colSpecs).value = "STRESS-MIXED-UPDATE";

      // 3. Delete row 5
      ws.getRow(5).getCell(colAction).value = "DELETE";

      // 4. Add cross-ref to row 6
      const row6National = String(
        ws.getRow(6).getCell(colNational).value ?? ""
      );
      ws.getRow(6).getCell(colNational).value = row6National
        ? `${row6National};STRESS-MIX-XREF`
        : "STRESS-MIX-XREF";

      // 5. Delete cross-ref from row 7 (if it has one)
      const row7National = String(
        ws.getRow(7).getCell(colNational).value ?? ""
      );
      if (row7National) {
        const skus = row7National.split(";").map((s: string) => s.trim());
        if (skus.length > 0) {
          skus[0] = `[DELETE]${skus[0]}`;
          ws.getRow(7).getCell(colNational).value = skus.join(";");
        }
      }

      const buffer = await saveWorkbook(wb);

      // Preview
      const preview = await previewImport(cookie, buffer);
      const s = preview.diff?.summary;
      console.log(
        `  Preview: valid=${preview.valid} adds=${s?.totalAdds} updates=${s?.totalUpdates} deletes=${s?.totalDeletes}`
      );
      assert(preview.valid === true, "should be valid");
      assert((s?.totalAdds ?? 0) > 0, "should have adds");
      assert((s?.totalUpdates ?? 0) > 0, "should have updates");
      assert((s?.totalDeletes ?? 0) > 0, "should have deletes");

      // Execute
      const exec = await executeImport(cookie, buffer);
      console.log(`  Execute: success=${exec.success}`);
      assert(exec.success === true, "execute should succeed");

      // Restore
      await restoreBaseline();
    });
  }

  // ====================================================================
  // Test 9a: Bulk Update (50 parts)
  // ====================================================================

  if (shouldRun(9)) {
    console.log("--- Test 9a: Bulk Update (50 parts) ---");
    await runTest("9a. Bulk update 50 parts", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);
      const colSpecs = findColumn(ws, "Specifications");
      const totalDataRows = dataRowCount(ws);
      const updateCount = Math.min(50, totalDataRows);

      for (let i = 0; i < updateCount; i++) {
        ws.getRow(4 + i).getCell(colSpecs).value = `BULK-UPDATE-${i + 1}`;
      }

      const buffer = await saveWorkbook(wb);
      const preview = await previewImport(cookie, buffer);
      console.log(
        `  Preview: updates=${preview.diff?.summary?.totalUpdates}`
      );
      assert(
        preview.diff?.parts?.updates?.length >= updateCount,
        `should have >= ${updateCount} part updates`
      );

      // Execute
      const exec = await executeImport(cookie, buffer);
      assert(exec.success === true, "execute should succeed");

      // Restore
      await restoreBaseline();
    });

    // ====================================================================
    // Test 9b: Bulk Delete (50 parts)
    // ====================================================================

    console.log("--- Test 9b: Bulk Delete (50 parts) ---");
    await runTest("9b. Bulk delete 50 parts", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);
      const colAction = findColumn(ws, "_action");
      const totalDataRows = dataRowCount(ws);
      const deleteCount = Math.min(50, totalDataRows);

      for (let i = 0; i < deleteCount; i++) {
        ws.getRow(4 + i).getCell(colAction).value = "DELETE";
      }

      const buffer = await saveWorkbook(wb);
      const preview = await previewImport(cookie, buffer);
      console.log(
        `  Preview: deletes=${preview.diff?.summary?.totalDeletes}`
      );
      assert(
        preview.diff?.parts?.deletes?.length >= deleteCount,
        `should have >= ${deleteCount} part deletes`
      );

      // Execute
      const exec = await executeImport(cookie, buffer);
      assert(exec.success === true, "execute should succeed");

      const afterParts = await countParts();
      assertEqual(
        afterParts,
        baselineCounts.parts - deleteCount,
        "parts count after bulk delete"
      );

      // Restore
      await restoreBaseline();
      assertEqual(await countParts(), baselineCounts.parts, "parts restored");
    });

    // ====================================================================
    // Test 9c: Bulk Add (50 parts)
    // ====================================================================

    console.log("--- Test 9c: Bulk Add (50 parts with cross-refs) ---");
    await runTest("9c. Bulk add 50 parts with cross-refs", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);
      const colSku = findColumn(ws, "ACR SKU");
      const colType = findColumn(ws, "Part Type");
      const colPosition = findColumn(ws, "Position");
      const colNational = findColumn(ws, "National");
      const baseRow = dataRowCount(ws) + 4;

      for (let i = 0; i < 50; i++) {
        const row = ws.getRow(baseRow + i);
        row.getCell(colSku).value = `ACR-STRESS-BULK-${String(i + 1).padStart(3, "0")}`;
        row.getCell(colType).value = "Brake Rotor";
        row.getCell(colPosition).value = "Front";
        row.getCell(colNational).value = `STRESS-BULK-NAT-${i + 1}`;
      }

      const buffer = await saveWorkbook(wb);
      const preview = await previewImport(cookie, buffer);
      console.log(
        `  Preview: adds=${preview.diff?.summary?.totalAdds}`
      );
      assert(
        preview.diff?.parts?.adds?.length >= 50,
        "should have >= 50 part adds"
      );

      // Execute
      const exec = await executeImport(cookie, buffer);
      assert(exec.success === true, "execute should succeed");

      const afterParts = await countParts();
      assertEqual(
        afterParts,
        baselineCounts.parts + 50,
        "parts count after bulk add"
      );

      // Restore
      await restoreBaseline();
    });

    // ====================================================================
    // Test 9d: Bulk Mixed (100+ operations)
    // ====================================================================

    console.log("--- Test 9d: Bulk Mixed (100+ operations) ---");
    await runTest("9d. Bulk mixed 100+ operations", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);
      const colSku = findColumn(ws, "ACR SKU");
      const colType = findColumn(ws, "Part Type");
      const colPosition = findColumn(ws, "Position");
      const colAction = findColumn(ws, "_action");
      const colSpecs = findColumn(ws, "Specifications");
      const colNational = findColumn(ws, "National");
      const totalDataRows = dataRowCount(ws);

      // 25 updates (rows 4-28)
      for (let i = 0; i < 25 && i < totalDataRows; i++) {
        ws.getRow(4 + i).getCell(colSpecs).value = `BULK-MIX-UPDATE-${i + 1}`;
      }

      // 25 deletes (rows 29-53)
      for (let i = 25; i < 50 && i < totalDataRows; i++) {
        ws.getRow(4 + i).getCell(colAction).value = "DELETE";
      }

      // 25 adds
      const baseRow = totalDataRows + 4;
      for (let i = 0; i < 25; i++) {
        const row = ws.getRow(baseRow + i);
        row.getCell(colSku).value = `ACR-STRESS-MIX-${String(i + 1).padStart(3, "0")}`;
        row.getCell(colType).value = "Brake Rotor";
        row.getCell(colPosition).value = "Front";
        row.getCell(colNational).value = `STRESS-MIX-NAT-${i + 1}`;
      }

      // 25 cross-ref changes on rows 54-78 (add a new cross-ref)
      for (let i = 50; i < 75 && i < totalDataRows; i++) {
        const existing = String(
          ws.getRow(4 + i).getCell(colNational).value ?? ""
        );
        const newVal = existing
          ? `${existing};STRESS-MIX-XR-${i}`
          : `STRESS-MIX-XR-${i}`;
        ws.getRow(4 + i).getCell(colNational).value = newVal;
      }

      const buffer = await saveWorkbook(wb);
      const preview = await previewImport(cookie, buffer);
      const s = preview.diff?.summary;
      console.log(
        `  Preview: adds=${s?.totalAdds} updates=${s?.totalUpdates} deletes=${s?.totalDeletes}`
      );
      assert(preview.valid === true, "should be valid");
      assert((s?.totalAdds ?? 0) >= 25, "should have >= 25 adds");
      assert((s?.totalUpdates ?? 0) >= 25, "should have >= 25 updates");
      assert((s?.totalDeletes ?? 0) >= 25, "should have >= 25 deletes");

      // Execute
      const exec = await executeImport(cookie, buffer);
      console.log(`  Execute: success=${exec.success}`);
      assert(exec.success === true, "execute should succeed");

      // Restore
      await restoreBaseline();
    });
  }

  // ====================================================================
  // Test 10: Rollback
  // ====================================================================

  if (shouldRun(10)) {
    console.log("--- Test 10: Rollback ---");
    await runTest("10. Rollback after import", async () => {
      // First, do an import to create something to rollback
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);
      const colSpecs = findColumn(ws, "Specifications");

      // Update 10 rows
      for (let i = 0; i < 10; i++) {
        ws.getRow(4 + i).getCell(colSpecs).value = `ROLLBACK-TEST-${i + 1}`;
      }

      const buffer = await saveWorkbook(wb);
      const exec = await executeImport(cookie, buffer);
      assert(exec.success === true, "import should succeed");
      assert(exec.importId, "should have importId");
      console.log(`  Import done: ${exec.importId}`);

      // Rollback
      const rollback = await rollbackImport(cookie, exec.importId);
      console.log(
        `  Rollback: success=${rollback.success}`,
        rollback.error ?? ""
      );
      assert(rollback.success === true, "rollback should succeed");

      // Verify counts match baseline
      const afterParts = await countParts();
      assertEqual(afterParts, baselineCounts.parts, "parts after rollback");
    });
  }

  // ====================================================================
  // Test 11: Edge Cases (graceful failures)
  // ====================================================================

  if (shouldRun(11)) {
    console.log("--- Test 11: Edge Cases ---");

    // 11a: No Parts sheet
    await runTest("11a. No Parts sheet -> validation error", async () => {
      const wb = new ExcelJS.Workbook();
      wb.addWorksheet("Not Parts");
      const buffer = await saveWorkbook(wb);
      const result = await previewImport(cookie, buffer);
      console.log(`  valid=${result.valid} errors=${result.errors?.length}`);
      assert(result.valid === false || result.error, "should fail validation");
    });

    // 11b: Duplicate ACR SKUs
    await runTest("11b. Duplicate SKUs -> E2 error", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const ws = getPartsSheet(wb);
      const colSku = findColumn(ws, "ACR SKU");

      // Copy SKU from row 4 to a new row
      const origSku = String(ws.getRow(4).getCell(colSku).value);
      const newRow = dataRowCount(ws) + 4;
      ws.getRow(newRow).getCell(colSku).value = origSku;
      ws.getRow(newRow).getCell(findColumn(ws, "Part Type")).value =
        "Brake Rotor";

      const buffer = await saveWorkbook(wb);
      const result = await previewImport(cookie, buffer);
      console.log(`  valid=${result.valid} errors=${result.errors?.length}`);
      assert(result.valid === false, "should fail with duplicate SKU");
    });

    // 11c: Invalid year range
    await runTest("11c. Invalid year range -> E6 error", async () => {
      const wb = await loadWorkbook(baselineBuffer);
      const vaSheet = getVehicleAppsSheet(wb);

      // Find Start Year and End Year columns
      let colStart = 0,
        colEnd = 0;
      const headerRow = vaSheet.getRow(2);
      for (let col = 1; col <= vaSheet.columnCount; col++) {
        const val = String(headerRow.getCell(col).value ?? "")
          .trim()
          .toLowerCase();
        if (val === "start year") colStart = col;
        if (val === "end year") colEnd = col;
      }

      if (colStart && colEnd) {
        // Set end year < start year on first data row
        vaSheet.getRow(4).getCell(colStart).value = 2025;
        vaSheet.getRow(4).getCell(colEnd).value = 2020;
      }

      const buffer = await saveWorkbook(wb);
      const result = await previewImport(cookie, buffer);
      console.log(`  valid=${result.valid} errors=${result.errors?.length}`);
      // This may be a warning or error depending on implementation
      const hasYearIssue =
        result.valid === false ||
        result.errors?.some((e: any) => e.code === "E6") ||
        result.warnings?.some((w: any) => w.code === "E6" || w.code === "W6");
      assert(hasYearIssue, "should flag invalid year range");
    });

    // 11f: Empty workbook
    await runTest("11f. Empty workbook -> graceful error", async () => {
      const wb = new ExcelJS.Workbook();
      const buffer = await saveWorkbook(wb);
      const result = await previewImport(cookie, buffer);
      console.log(`  valid=${result.valid} error=${result.error}`);
      assert(
        result.valid === false || result.error,
        "should fail gracefully"
      );
    });

    // 11g: Correct sheets but zero data rows
    await runTest(
      "11g. Zero data rows -> graceful handling",
      async () => {
        const wb = await loadWorkbook(baselineBuffer);
        const ws = getPartsSheet(wb);

        // Delete all data rows (keep headers + instructions)
        const totalRows = ws.rowCount;
        for (let r = totalRows; r >= 4; r--) {
          ws.spliceRows(r, 1);
        }

        const buffer = await saveWorkbook(wb);
        const result = await previewImport(cookie, buffer);
        console.log(`  valid=${result.valid} error=${result.error}`);
        // Could be valid with 0 changes or an error — both are graceful
        assert(
          result.valid !== undefined || result.error,
          "should respond gracefully"
        );
      }
    );
  }

  // ====================================================================
  // Summary
  // ====================================================================

  printSummary();
}

function printSummary() {
  console.log("\n" + "=".repeat(70));
  console.log("  STRESS TEST SUMMARY");
  console.log("=".repeat(70));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  for (const r of results) {
    const icon = r.passed ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${r.name} (${r.duration}ms)`);
    if (!r.passed) {
      console.log(`         ${r.details}`);
    }
  }

  console.log("");
  console.log(`  Total: ${total}  Passed: ${passed}  Failed: ${failed}`);
  console.log("=".repeat(70));

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
