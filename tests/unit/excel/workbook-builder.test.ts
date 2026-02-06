import { describe, it, expect } from "@jest/globals";
import ExcelJS from "exceljs";
import {
  TestWorkbookBuilder,
  SHEET_NAMES,
  COLUMN_HEADERS,
} from "../../e2e/helpers/workbook-builder";
import { ExcelImportService } from "../../../src/services/excel/import/ExcelImportService";

/**
 * Unit tests for TestWorkbookBuilder.
 *
 * The critical check: workbooks produced by the builder must be parseable
 * by ExcelImportService.parseFile() — proving round-trip compatibility.
 */

/**
 * Find a column number by its header text in row 2 (column header row).
 * ExcelJS loses key associations after serialize/deserialize, so we
 * look up by header text instead.
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
  if (colNum === -1) throw new Error(`Header "${headerText}" not found in row 2`);
  return colNum;
}

describe("TestWorkbookBuilder", () => {
  it("generates a valid Excel buffer", async () => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-TEST-001",
      part_type: "MAZA",
      status: "Activo",
    });

    const buffer = await builder.toBuffer();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("produces workbook with correct sheet names", async () => {
    const builder = new TestWorkbookBuilder();
    builder
      .addPart({ acr_sku: "ACR-TEST-001", part_type: "MAZA" })
      .addAlias({ alias: "test", canonical_name: "TEST", alias_type: "make" });

    const buffer = await builder.toBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheetNames = workbook.worksheets.map((ws) => ws.name);
    expect(sheetNames).toContain(SHEET_NAMES.PARTS);
    expect(sheetNames).toContain(SHEET_NAMES.VEHICLE_APPLICATIONS);
    expect(sheetNames).toContain(SHEET_NAMES.ALIASES);
  });

  it("omits Aliases sheet when no aliases are added", async () => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({ acr_sku: "ACR-TEST-001", part_type: "MAZA" });

    const buffer = await builder.toBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheetNames = workbook.worksheets.map((ws) => ws.name);
    expect(sheetNames).not.toContain(SHEET_NAMES.ALIASES);
  });

  it("uses 3-row header format (group, column, instructions)", async () => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({ acr_sku: "ACR-TEST-001", part_type: "MAZA" });

    const buffer = await builder.toBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    // Row 1: Group headers (e.g., "Part Information")
    const row1Values: string[] = [];
    partsSheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
      row1Values.push(cell.value?.toString() || "");
    });
    expect(row1Values).toContain("Part Information");
    expect(row1Values).toContain("Cross-References");

    // Row 2: Column headers (e.g., "ACR SKU", "Part Type")
    const row2Values: string[] = [];
    partsSheet.getRow(2).eachCell({ includeEmpty: false }, (cell) => {
      row2Values.push(cell.value?.toString() || "");
    });
    expect(row2Values).toContain(COLUMN_HEADERS.PARTS.ACR_SKU);
    expect(row2Values).toContain(COLUMN_HEADERS.PARTS.PART_TYPE);

    // Row 3: Instructions (e.g., "separate with ;")
    const row3Values: string[] = [];
    partsSheet.getRow(3).eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value;
      if (typeof val === "object" && val !== null && "text" in val) {
        row3Values.push((val as any).text);
      } else {
        row3Values.push(val?.toString() || "");
      }
    });
    expect(row3Values.some((v) => v.includes("separate with"))).toBe(true);

    // Row 4: Data — find ACR SKU column by header
    const row4 = partsSheet.getRow(4);
    const acrSkuColNum = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.ACR_SKU);
    expect(row4.getCell(acrSkuColNum).value).toBe("ACR-TEST-001");
  });

  it("hidden columns (_id, _action) are marked hidden", async () => {
    const builder = new TestWorkbookBuilder();
    builder.addPart({
      acr_sku: "ACR-TEST-001",
      part_type: "MAZA",
      _id: "00000000-0000-0000-0000-000000000001",
    });

    const buffer = await builder.toBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    const idColNum = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.ID);
    const actionColNum = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.ACTION);
    expect(partsSheet.getColumn(idColNum).hidden).toBe(true);
    expect(partsSheet.getColumn(actionColNum).hidden).toBe(true);
  });

  it("addPartWithCrossRefs populates brand columns", async () => {
    const builder = new TestWorkbookBuilder();
    builder.addPartWithCrossRefs(
      { acr_sku: "ACR-TEST-001", part_type: "MAZA" },
      { national: ["NAT-001", "NAT-002"], atv: ["ATV-001"] }
    );

    const buffer = await builder.toBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    const row4 = partsSheet.getRow(4);
    const nationalColNum = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.NATIONAL_SKUS);
    const atvColNum = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.ATV_SKUS);

    expect(row4.getCell(nationalColNum).value).toBe("NAT-001;NAT-002");
    expect(row4.getCell(atvColNum).value).toBe("ATV-001");
  });

  it("vehicle applications sheet has correct data", async () => {
    const builder = new TestWorkbookBuilder();
    builder
      .addPart({ acr_sku: "ACR-TEST-001", part_type: "MAZA" })
      .addVehicleApp({
        acr_sku: "ACR-TEST-001",
        make: "TOYOTA",
        model: "CAMRY",
        start_year: 2020,
        end_year: 2024,
      });

    const buffer = await builder.toBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const vaSheet = workbook.getWorksheet(SHEET_NAMES.VEHICLE_APPLICATIONS)!;

    const row4 = vaSheet.getRow(4);
    const skuCol = findColByHeader(vaSheet, COLUMN_HEADERS.VEHICLE_APPLICATIONS.ACR_SKU);
    const makeCol = findColByHeader(vaSheet, COLUMN_HEADERS.VEHICLE_APPLICATIONS.MAKE);
    const startCol = findColByHeader(vaSheet, COLUMN_HEADERS.VEHICLE_APPLICATIONS.START_YEAR);

    expect(row4.getCell(skuCol).value).toBe("ACR-TEST-001");
    expect(row4.getCell(makeCol).value).toBe("TOYOTA");
    expect(row4.getCell(startCol).value).toBe(2020);
  });

  it("setPartAction and setPartId modify existing rows", async () => {
    const builder = new TestWorkbookBuilder();
    builder
      .addPart({ acr_sku: "ACR-TEST-001", part_type: "MAZA" })
      .setPartId(0, "11111111-1111-1111-1111-111111111111")
      .setPartAction(0, "DELETE");

    const buffer = await builder.toBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const partsSheet = workbook.getWorksheet(SHEET_NAMES.PARTS)!;

    const row4 = partsSheet.getRow(4);
    const idColNum = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.ID);
    const actionColNum = findColByHeader(partsSheet, COLUMN_HEADERS.PARTS.ACTION);
    expect(row4.getCell(idColNum).value).toBe(
      "11111111-1111-1111-1111-111111111111"
    );
    expect(row4.getCell(actionColNum).value).toBe("DELETE");
  });

  it("is parseable by ExcelImportService", async () => {
    const builder = new TestWorkbookBuilder();
    builder
      .addPart({
        acr_sku: "ACR-PARSE-001",
        part_type: "MAZA",
        status: "Activo",
        specifications: "Test specs",
      })
      .addPartWithCrossRefs(
        { acr_sku: "ACR-PARSE-002", part_type: "ROTOR", status: "Inactivo" },
        { national: ["N1", "N2"], atv: ["A1"] }
      )
      .addVehicleApp({
        acr_sku: "ACR-PARSE-001",
        make: "FORD",
        model: "F-150",
        start_year: 2015,
        end_year: 2020,
      })
      .addAlias({
        alias: "test-alias",
        canonical_name: "TEST",
        alias_type: "make",
      });

    const buffer = await builder.toBuffer();

    // Create a File-like object with arrayBuffer() polyfill for Node/Jest.
    // Must copy into a fresh ArrayBuffer — Buffer.buffer may be a shared pool.
    const ab = new ArrayBuffer(buffer.length);
    new Uint8Array(ab).set(buffer);
    const file = {
      name: "test-import.xlsx",
      size: buffer.length,
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      arrayBuffer: () => Promise.resolve(ab),
    } as unknown as File;

    const service = new ExcelImportService();
    const parsed = await service.parseFile(file);

    // Parts parsed correctly
    expect(parsed.parts.rowCount).toBe(2);
    expect(parsed.parts.data[0].acr_sku).toBe("ACR-PARSE-001");
    expect(parsed.parts.data[0].part_type).toBe("MAZA");
    expect(parsed.parts.data[0].status).toBe("Activo");
    expect(parsed.parts.data[0].specifications).toBe("Test specs");

    // Cross-refs are inline in parts sheet
    expect(parsed.parts.data[1].acr_sku).toBe("ACR-PARSE-002");
    expect(parsed.parts.data[1].national_skus).toBe("N1;N2");
    expect(parsed.parts.data[1].atv_skus).toBe("A1");

    // Vehicle applications parsed
    expect(parsed.vehicleApplications.rowCount).toBe(1);
    expect(parsed.vehicleApplications.data[0].make).toBe("FORD");
    expect(parsed.vehicleApplications.data[0].start_year).toBe(2015);

    // Aliases parsed — instruction row is now correctly skipped (fix: 4hy.7)
    expect(parsed.aliases).toBeDefined();
    expect(parsed.aliases!.rowCount).toBe(1);
    expect(parsed.aliases!.data[0].alias).toBe("test-alias");
    expect(parsed.aliases!.data[0].canonical_name).toBe("TEST");
  });
});
