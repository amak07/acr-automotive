// Excel parser tests - ACR Automotive
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { ExcelParser } from "../parser";
import { SPANISH_HEADERS } from "../types";

describe("ExcelParser", () => {
  describe("Header Detection", () => {
    // Test that we can find Spanish column headers in the full CATALOGACION format
    test("should detect CATALOGACION format headers", () => {
      // This is the exact header row from Humberto's CATALOGACION file
      const headers = [
        "#",
        "ACR",
        "SYD",
        "TMK ",
        "Clase",
        "Posicion",
        "Sistema",
        "Birlos",
        "Traccion",
        "Observaciones",
        "MARCA",
        "APLICACIÓN ",
        "AÑO ",
        "URL IMAGEN ",
      ];

      const result = ExcelParser["matchHeaders"](headers);

      // Should recognize this as CATALOGACION format with all columns mapped
      expect(result.mapping).toBeDefined();
      expect(result.format).toBe("CATALOGACION");

      // Check that each important column is mapped to the right position
      expect(result.mapping?.acrSku).toBe(1); // Column B (ACR)
      expect(result.mapping?.competitorSku).toBe(3); // Column D (TMK)
      expect(result.mapping?.partType).toBe(4); // Column E (Clase)
      expect(result.mapping?.make).toBe(10); // Column K (MARCA)
      expect(result.mapping?.model).toBe(11); // Column L (APLICACIÓN)
      expect(result.mapping?.yearRange).toBe(12); // Column M (AÑO)
    });

    // Test that we can handle the simpler LISTA DE PRECIOS format
    test("should detect LISTA DE PRECIOS format headers", () => {
      // Simpler format with just the essential columns
      const headers = ["ACR", "CLASE", "MARCA", "APLICACION", "AÑO", "IMAGEN"];

      const result = ExcelParser["matchHeaders"](headers);

      // Should recognize as price list format (no competitor SKU column)
      expect(result.mapping).toBeDefined();
      expect(result.format).toBe("LISTA_DE_PRECIOS");
      expect(result.mapping?.acrSku).toBe(0);
      expect(result.mapping?.partType).toBe(1);
      expect(result.mapping?.make).toBe(2);
      expect(result.mapping?.competitorSku).toBeUndefined(); // No TMK column
    });

    // Test that Spanish accents don't break our header detection
    test("should handle Spanish accents and variations", () => {
      // Headers with Spanish accents like APLICACIÓN and AÑO
      const headers = ["ACR", "Aplicación", "AÑO", "OBSERVACIONES"];

      const result = ExcelParser["matchHeaders"](headers);

      // Should match these despite the accents
      expect(result.mapping?.model).toBe(1); // APLICACIÓN with accent
      expect(result.mapping?.yearRange).toBe(2); // AÑO with ñ
      expect(result.mapping?.specifications).toBe(3); // OBSERVACIONES
    });

    // Test that our text cleaning works correctly
    test("should normalize headers correctly", () => {
      // Should remove extra spaces and convert accents
      expect(ExcelParser["normalizeHeader"]("  TMK  ")).toBe("TMK");
      expect(ExcelParser["normalizeHeader"]("APLICACIÓN")).toBe("APLICACION"); // Ó → O
      expect(ExcelParser["normalizeHeader"]("AÑO")).toBe("ANO"); // Ñ → N
      expect(ExcelParser["normalizeHeader"]("Observaciones")).toBe(
        "OBSERVACIONES"
      ); // Uppercase
    });

    // Test that our flexible matching catches small differences
    test("should match headers with flexible comparison", () => {
      // Should handle extra spaces
      expect(ExcelParser["headersMatch"]("TMK", "TMK ")).toBe(true);

      // Should handle accents vs no accents
      expect(ExcelParser["headersMatch"]("APLICACION", "APLICACIÓN")).toBe(
        true
      );
      expect(ExcelParser["headersMatch"]("ANO", "AÑO")).toBe(true);

      // Should handle partial matches for obvious cases
      expect(ExcelParser["headersMatch"]("URL IMAGEN", "URL")).toBe(true);
    });
  });

  describe("Data Validation", () => {
    // Test that rows with all required fields pass validation
    test("should validate required fields correctly", () => {
      // A complete, valid row with all required fields filled
      const validRow = {
        acrSku: "ACR512342",
        partType: "MAZA",
        make: "HONDA",
        model: "PILOT",
        yearRange: "2007-2013",
      };

      const errors = ExcelParser["validateRowData"](validRow, 5);
      expect(errors).toHaveLength(0); // Should have no validation errors
    });

    // Test that missing required fields are caught
    test("should catch missing required fields", () => {
      // A row missing the ACR SKU and vehicle make (both required)
      const invalidRow = {
        acrSku: "", // ❌ Empty (required)
        partType: "MAZA",
        make: "", // ❌ Empty (required)
        model: "PILOT",
        yearRange: "2007-2013",
      };

      const errors = ExcelParser["validateRowData"](invalidRow, 5);
      expect(errors).toHaveLength(2); // Should find 2 errors
      expect(errors[0].field).toBe("acrSku"); // First error: missing ACR SKU
      expect(errors[1].field).toBe("make"); // Second error: missing make
    });

    // Test that we can tell when a row is completely empty
    test("should detect empty rows correctly", () => {
      // A completely empty row (all fields blank)
      const emptyRow = {
        acrSku: "",
        partType: "",
        make: "",
        model: "",
        yearRange: "",
      };

      expect(ExcelParser["isEmptyRow"](emptyRow)).toBe(true); // Should be considered empty

      // A row with at least one field filled
      const nonEmptyRow = {
        acrSku: "ACR123", // Has data
        partType: "",
        make: "",
        model: "",
        yearRange: "",
      };

      expect(ExcelParser["isEmptyRow"](nonEmptyRow)).toBe(false); // Should NOT be considered empty
    });
  });

  describe("Field Weights", () => {
    // Test that critical fields get higher importance scores for header detection
    test("should assign correct importance weights", () => {
      // Most important: ACR SKU (the part number)
      expect(ExcelParser["getFieldWeight"]("acrSku")).toBe(20);

      // Very important: Part type and vehicle info (business critical)
      expect(ExcelParser["getFieldWeight"]("partType")).toBe(15);
      expect(ExcelParser["getFieldWeight"]("make")).toBe(15);
      expect(ExcelParser["getFieldWeight"]("model")).toBe(15);

      // Important: Year range and competitor cross-reference
      expect(ExcelParser["getFieldWeight"]("yearRange")).toBe(10);
      expect(ExcelParser["getFieldWeight"]("competitorSku")).toBe(8);

      // Optional: Position and other attributes
      expect(ExcelParser["getFieldWeight"]("position")).toBe(5);

      // Ignored: SYD column (not used in our system)
      expect(ExcelParser["getFieldWeight"]("syd")).toBe(0);
    });
  });

  describe("Spanish Headers Constants", () => {
    // Test that we have the right Spanish header names for each field
    test("should have all required field mappings", () => {
      // Check that our header mappings include the expected Spanish terms
      expect(SPANISH_HEADERS.acrSku).toContain("ACR");
      expect(SPANISH_HEADERS.partType).toContain("Clase");
      expect(SPANISH_HEADERS.make).toContain("MARCA");
      expect(SPANISH_HEADERS.model).toContain("APLICACIÓN");
      expect(SPANISH_HEADERS.yearRange).toContain("AÑO");
      expect(SPANISH_HEADERS.competitorSku).toContain("TMK");
    });

    // Test that we support multiple variations of each header
    test("should include variations for each field", () => {
      // Each field should have multiple variations to handle different Excel formats
      expect(SPANISH_HEADERS.acrSku.length).toBeGreaterThan(1); // ACR, SKU ACR, etc.
      expect(SPANISH_HEADERS.partType.length).toBeGreaterThan(1); // Clase, CLASE, TIPO, etc.
      expect(SPANISH_HEADERS.make.length).toBeGreaterThan(1); // MARCA, Marca, FABRICANTE, etc.
    });
  });

  describe("Real Excel File Tests", () => {
    let catalogacionWorkbook: XLSX.WorkBook;
    let listaPreciosWorkbook: XLSX.WorkBook;

    beforeAll(() => {
      // Load Humberto's actual Excel files for testing
      const catalogacionPath = path.join(
        __dirname,
        "CATALOGACION ACR CLIENTES.xlsx"
      );
      const listaPreciosPath = path.join(
        __dirname,
        "09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx"
      );

      // Try to load the main catalog file (2,336 rows of parts data)
      if (fs.existsSync(catalogacionPath)) {
        const catalogacionBuffer = fs.readFileSync(catalogacionPath);
        catalogacionWorkbook = XLSX.read(catalogacionBuffer, {
          type: "buffer",
        });
      }

      // Try to load the price list file (simpler format)
      if (fs.existsSync(listaPreciosPath)) {
        const listaPreciosBuffer = fs.readFileSync(listaPreciosPath);
        listaPreciosWorkbook = XLSX.read(listaPreciosBuffer, {
          type: "buffer",
        });
      }
    });

    // Test that we can read and understand the real CATALOGACION file structure
    test("should successfully parse CATALOGACION file structure", () => {
      if (!catalogacionWorkbook) {
        console.log("CATALOGACION file not found, skipping test");
        return;
      }

      // Get basic file information from the loaded Excel workbook
      const sheetName = catalogacionWorkbook.SheetNames[0];
      const worksheet = catalogacionWorkbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");

      console.log(`CATALOGACION file info:`);
      console.log(`- Sheet: ${sheetName}`);
      console.log(`- Total rows: ${range.e.r + 1}`);
      console.log(`- Total columns: ${range.e.c + 1}`);

      // Test our header detection on the real file
      const mockFileInfo = {
        fileName: "CATALOGACION ACR CLIENTES.xlsx",
        fileSize: 0,
        sheetCount: 1,
        activeSheetName: sheetName,
        headerRow: 1,
        dataStartRow: 2,
        totalRows: range.e.r + 1,
        detectedFormat: "UNKNOWN" as const,
      };

      const columnDetection = ExcelParser.detectColumnMapping(
        worksheet,
        mockFileInfo
      );

      console.log(`Column detection result:`);
      console.log(`- Format detected: ${columnDetection.detectedFormat}`);
      console.log(`- Header row: ${columnDetection.headerRow}`);
      console.log(`- Mapping found: ${columnDetection.mapping ? "Yes" : "No"}`);

      // Show which columns we mapped (useful for debugging)
      if (columnDetection.mapping) {
        console.log(`- ACR column: ${columnDetection.mapping.acrSku}`);
        console.log(`- Part Type column: ${columnDetection.mapping.partType}`);
        console.log(`- Make column: ${columnDetection.mapping.make}`);
        console.log(`- Model column: ${columnDetection.mapping.model}`);
        console.log(`- Year column: ${columnDetection.mapping.yearRange}`);

        if (columnDetection.mapping.competitorSku !== undefined) {
          console.log(
            `- Competitor SKU column: ${columnDetection.mapping.competitorSku}`
          );
        }
      }

      // Verify that our parser successfully understood the file
      expect(columnDetection.mapping).toBeDefined();
      expect(columnDetection.detectedFormat).toBe("CATALOGACION");
      expect(columnDetection.errors.length).toBe(0);
    });

    // Test that we can actually extract real auto parts data from the file
    test("should parse sample data from CATALOGACION file", () => {
      if (!catalogacionWorkbook) {
        console.log("CATALOGACION file not found, skipping test");
        return;
      }

      const sheetName = catalogacionWorkbook.SheetNames[0];
      const worksheet = catalogacionWorkbook.Sheets[sheetName];

      const mockFileInfo = {
        fileName: "CATALOGACION ACR CLIENTES.xlsx",
        fileSize: 0,
        sheetCount: 1,
        activeSheetName: sheetName,
        headerRow: 1,
        dataStartRow: 2,
        totalRows: 100, // Limit to first 100 rows for testing
        detectedFormat: "CATALOGACION" as const,
      };

      const columnDetection = ExcelParser.detectColumnMapping(
        worksheet,
        mockFileInfo
      );

      if (!columnDetection.mapping) {
        throw new Error("Column mapping failed");
      }

      // Parse first 10 rows of data
      const { rows, errors } = ExcelParser.parseExcelData(
        worksheet,
        columnDetection.mapping,
        2, // Start from row 2 (after headers)
        { ...mockFileInfo, totalRows: 11 } // Header + 10 data rows
      );

      console.log(`Parsed ${rows.length} sample rows`);
      console.log(`Found ${errors.length} parsing errors`);

      // Show a sample of the actual data we extracted
      if (rows.length > 0) {
        console.log("Sample row:", {
          acrSku: rows[0].acrSku,
          partType: rows[0].partType,
          make: rows[0].make,
          model: rows[0].model,
          yearRange: rows[0].yearRange,
          competitorSku: rows[0].competitorSku,
        });
      }

      // Verify we got valid auto parts data
      expect(rows.length).toBeGreaterThan(0); // Should parse some rows
      expect(rows[0].acrSku).toMatch(/^ACR/i); // ACR part numbers start with "ACR"
      expect(rows[0].partType).toBeTruthy(); // Should have part type (like MAZA)
      expect(rows[0].make).toBeTruthy(); // Should have vehicle make (like HONDA)
      expect(rows[0].model).toBeTruthy(); // Should have vehicle model (like PILOT)
      expect(rows[0].yearRange).toBeTruthy(); // Should have year range (like 2007-2013)
    });

    // Test that the overall file validation process works with real data
    test("should validate CATALOGACION file completely", async () => {
      if (!catalogacionWorkbook) {
        console.log("CATALOGACION file not found, skipping test");
        return;
      }

      // Create a mock File object from the workbook data
      const catalogacionPath = path.join(
        __dirname,
        "CATALOGACION ACR CLIENTES.xlsx"
      );
      const buffer = fs.readFileSync(catalogacionPath);

      // Mock File constructor is not available in Node.js, so we'll test the workbook directly
      const sheetName = catalogacionWorkbook.SheetNames[0];
      const worksheet = catalogacionWorkbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");

      const fileInfo = {
        fileName: "CATALOGACION ACR CLIENTES.xlsx",
        fileSize: buffer.length,
        sheetCount: catalogacionWorkbook.SheetNames.length,
        activeSheetName: sheetName,
        headerRow: 1,
        dataStartRow: 2,
        totalRows: range.e.r + 1,
        detectedFormat: "UNKNOWN" as const,
      };

      // Test column detection
      const columnDetection = ExcelParser.detectColumnMapping(
        worksheet,
        fileInfo
      );

      console.log(`Full file validation:`);
      console.log(`- Total rows: ${fileInfo.totalRows}`);
      console.log(`- Format: ${columnDetection.detectedFormat}`);
      console.log(`- Column mapping errors: ${columnDetection.errors.length}`);

      // Verify the file meets our expectations for a real parts catalog
      expect(columnDetection.mapping).toBeDefined();
      expect(columnDetection.detectedFormat).toBe("CATALOGACION");
      expect(fileInfo.totalRows).toBeGreaterThan(1000); // Should have many parts (expecting 2,336)
    });

    // Test that we can see the actual Spanish headers in Humberto's file
    test("should extract actual headers from CATALOGACION file", () => {
      if (!catalogacionWorkbook) {
        console.log("CATALOGACION file not found, skipping test");
        return;
      }

      const sheetName = catalogacionWorkbook.SheetNames[0];
      const worksheet = catalogacionWorkbook.Sheets[sheetName];

      // Extract the actual header row to see what Spanish headers look like
      const headers = ExcelParser["extractHeaderRow"](worksheet, 1);

      console.log("Actual headers from CATALOGACION file:");
      headers.forEach((header, index) => {
        const columnLetter = String.fromCharCode(65 + index); // A, B, C...
        console.log(`  ${columnLetter}: "${header}"`);
      });

      // Verify we can find the key Spanish headers we need
      expect(headers).toContain("ACR"); // Part number column
      expect(
        headers.some((h) => h.includes("Clase") || h.includes("CLASE"))
      ).toBe(true); // Part type
      expect(headers.some((h) => h.includes("MARCA"))).toBe(true); // Vehicle make
      expect(
        headers.some(
          (h) => h.includes("APLICACIÓN") || h.includes("APLICACION")
        )
      ).toBe(true); // Vehicle model
      expect(headers.some((h) => h.includes("AÑO") || h.includes("ANO"))).toBe(
        true
      ); // Year range
    });
  });
});
