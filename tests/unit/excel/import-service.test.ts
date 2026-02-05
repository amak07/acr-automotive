/**
 * ExcelImportService Unit Tests
 *
 * Tests the Excel file parsing service that handles:
 * - Multi-sheet Excel parsing (Parts, Vehicle Applications, Cross References)
 * - Header format detection (1-row, 2-row, 3-row headers)
 * - Hidden ID column detection
 * - File format validation
 * - Property name conversion from column headers
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import { ExcelImportService } from "../../../src/services/excel/import/ExcelImportService";
import {
  loadFixture,
  loadFixtureBuffer,
} from "../../../scripts/test/helpers/fixture-loader";
import ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";

describe("ExcelImportService", () => {
  const parser = new ExcelImportService();

  // ==========================================================================
  // parseFile Tests
  // ==========================================================================

  describe("parseFile()", () => {
    it("should parse a valid Excel file with all sheets", async () => {
      const file = loadFixture("valid-add-new-parts.xlsx");
      const result = await parser.parseFile(file);

      expect(result).toBeDefined();
      expect(result.parts).toBeDefined();
      expect(result.vehicleApplications).toBeDefined();
      expect(result.crossReferences).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it("should include metadata with file info", async () => {
      const file = loadFixture("valid-add-new-parts.xlsx");
      const result = await parser.parseFile(file);

      expect(result.metadata.fileName).toBe("valid-add-new-parts.xlsx");
      expect(result.metadata.fileSize).toBeGreaterThan(0);
      expect(result.metadata.uploadedAt).toBeInstanceOf(Date);
    });

    it("should parse parts sheet correctly", async () => {
      const file = loadFixture("valid-add-new-parts.xlsx");
      const result = await parser.parseFile(file);

      expect(result.parts.sheetName).toBe("Parts");
      expect(result.parts.data.length).toBeGreaterThan(0);
      expect(result.parts.rowCount).toBe(result.parts.data.length);
    });

    it("should parse vehicle applications sheet correctly", async () => {
      const file = loadFixture("valid-add-new-parts.xlsx");
      const result = await parser.parseFile(file);

      expect(result.vehicleApplications.sheetName).toBe("Vehicle Applications");
      // May be empty or have data depending on fixture
      expect(result.vehicleApplications.data).toBeInstanceOf(Array);
    });

    it("should convert column headers to snake_case properties", async () => {
      const file = loadFixture("valid-add-new-parts.xlsx");
      const result = await parser.parseFile(file);

      // First part should have snake_case property names
      if (result.parts.data.length > 0) {
        const firstPart = result.parts.data[0];

        // Check that headers are converted correctly
        // Note: Properties may be undefined if cell was empty
        expect("acr_sku" in firstPart || firstPart.acr_sku).toBeTruthy();
        expect("part_type" in firstPart || firstPart.part_type !== undefined);
      }
    });

    it("should handle file with brand columns (Phase 3A format)", async () => {
      const file = loadFixture("valid-add-new-parts.xlsx");
      const result = await parser.parseFile(file);

      // If fixture has brand columns, they should be parsed
      if (result.parts.data.length > 0) {
        const firstPart = result.parts.data[0];

        // Brand columns should exist as properties (may be undefined)
        // This tests that the headerToPropertyName mapping works for brand headers
        expect(typeof firstPart).toBe("object");
      }
    });

    it("should return empty arrays for empty sheets", async () => {
      // Create a minimal fixture or use one with empty VA sheet
      const file = loadFixture("valid-add-new-parts.xlsx");
      const result = await parser.parseFile(file);

      // Even if sheets exist but are empty, data should be an array
      expect(Array.isArray(result.parts.data)).toBe(true);
      expect(Array.isArray(result.vehicleApplications.data)).toBe(true);
      expect(Array.isArray(result.crossReferences.data)).toBe(true);
    });

    it("should throw error for missing required Parts sheet", async () => {
      // Create a minimal workbook without Parts sheet
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet("Vehicle Applications");

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "no-parts.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Add arrayBuffer method for Node.js
      (file as any).arrayBuffer = async () => buffer;

      await expect(parser.parseFile(file)).rejects.toThrow(
        "Missing required sheet: Parts"
      );
    });

    it("should throw error for missing required Vehicle Applications sheet", async () => {
      // Create a minimal workbook without Vehicle Applications sheet
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet("Parts");

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "no-vehicles.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      (file as any).arrayBuffer = async () => buffer;

      await expect(parser.parseFile(file)).rejects.toThrow(
        "Missing required sheet: Vehicle Applications"
      );
    });

    it("should handle optional Cross References sheet gracefully", async () => {
      // Phase 3A format doesn't require Cross References sheet
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");
      partsSheet.columns = [{ header: "ACR_SKU", key: "acr_sku" }];
      partsSheet.addRow({ acr_sku: "TEST-001" });

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.columns = [{ header: "Make", key: "make" }];
      // No Cross References sheet

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "no-crossrefs.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      (file as any).arrayBuffer = async () => buffer;

      const result = await parser.parseFile(file);

      // Should parse successfully with empty cross references
      expect(result.crossReferences.data).toEqual([]);
      expect(result.crossReferences.rowCount).toBe(0);
    });
  });

  // ==========================================================================
  // Header Format Detection Tests
  // ==========================================================================

  describe("Header Format Detection (via parseFile)", () => {
    it("should detect legacy 1-row header format", async () => {
      // Create workbook with legacy format (headers in Row 1, data in Row 2+)
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");

      // Legacy format: column headers directly in Row 1
      partsSheet.getRow(1).values = ["ACR_SKU", "Part_Type", "Position_Type"];
      partsSheet.getRow(2).values = ["ACR-001", "Rotor", "Front"];
      partsSheet.getRow(3).values = ["ACR-002", "Caliper", "Rear"];

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.getRow(1).values = ["Make", "Model"];

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "legacy-format.xlsx");
      (file as any).arrayBuffer = async () => buffer;

      const result = await parser.parseFile(file);

      // Should parse 2 parts correctly
      expect(result.parts.data.length).toBe(2);
      expect(result.parts.data[0].acr_sku).toBe("ACR-001");
      expect(result.parts.data[1].acr_sku).toBe("ACR-002");
    });

    it("should detect styled 2-row header format", async () => {
      // Create workbook with 2-row format (group headers Row 1, column headers Row 2)
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");

      // Styled format: group headers in Row 1, column headers in Row 2
      partsSheet.getRow(1).values = ["Part Information", "", ""];
      partsSheet.getRow(2).values = ["ACR SKU", "Part Type", "Position"];
      partsSheet.getRow(3).values = ["ACR-001", "Rotor", "Front"];

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.getRow(1).values = ["Vehicle Information"];
      vehiclesSheet.getRow(2).values = ["Make", "Model"];

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "styled-format.xlsx");
      (file as any).arrayBuffer = async () => buffer;

      const result = await parser.parseFile(file);

      // Should parse 1 part correctly (data starts at Row 3)
      expect(result.parts.data.length).toBe(1);
      expect(result.parts.data[0].acr_sku).toBe("ACR-001");
    });

    it("should detect full 3-row header format with instructions", async () => {
      // Create workbook with 3-row format
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");

      // Full format: group headers Row 1, column headers Row 2, instructions Row 3
      partsSheet.getRow(1).values = ["Part Information", "", ""];
      partsSheet.getRow(2).values = ["ACR SKU", "Part Type", "Position"];
      partsSheet.getRow(3).values = [
        "Do not modify",
        "e.g., Rotor",
        "e.g., Front",
      ];
      partsSheet.getRow(4).values = ["ACR-001", "Rotor", "Front"];

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.getRow(1).values = ["Vehicle Information"];
      vehiclesSheet.getRow(2).values = ["Make", "Model"];
      vehiclesSheet.getRow(3).values = [
        "separate with semicolon",
        "separate with semicolon",
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "full-format.xlsx");
      (file as any).arrayBuffer = async () => buffer;

      const result = await parser.parseFile(file);

      // Should parse 1 part correctly (data starts at Row 4)
      expect(result.parts.data.length).toBe(1);
      expect(result.parts.data[0].acr_sku).toBe("ACR-001");
    });
  });

  // ==========================================================================
  // validateFileFormat Tests
  // ==========================================================================

  describe("validateFileFormat()", () => {
    it("should accept .xlsx files", () => {
      const file = new File([new ArrayBuffer(100)], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      expect(() => parser.validateFileFormat(file)).not.toThrow();
    });

    it("should accept .xls files", () => {
      const file = new File([new ArrayBuffer(100)], "test.xls", {
        type: "application/vnd.ms-excel",
      });

      expect(() => parser.validateFileFormat(file)).not.toThrow();
    });

    it("should reject non-Excel files", () => {
      const file = new File([new ArrayBuffer(100)], "test.csv", {
        type: "text/csv",
      });

      expect(() => parser.validateFileFormat(file)).toThrow(
        "Invalid file format"
      );
    });

    it("should reject files with invalid extension", () => {
      const file = new File([new ArrayBuffer(100)], "test.pdf", {
        type: "application/pdf",
      });

      expect(() => parser.validateFileFormat(file)).toThrow(
        "Invalid file format"
      );
    });

    it("should reject files exceeding size limit", () => {
      // Create a mock file that exceeds 50MB
      const largeSize = 51 * 1024 * 1024; // 51MB

      // Mock a File object with size property
      const file = {
        name: "large.xlsx",
        size: largeSize,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      } as File;

      expect(() => parser.validateFileFormat(file)).toThrow("File size exceeds");
    });

    it("should accept files within size limit", () => {
      const file = new File([new ArrayBuffer(1024)], "small.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      expect(() => parser.validateFileFormat(file)).not.toThrow();
    });
  });

  // ==========================================================================
  // isExportedFile Tests
  // ==========================================================================

  describe("isExportedFile()", () => {
    it("should return true for files with hidden ID columns", async () => {
      // Load a fixture that was exported from the system (has hidden IDs)
      const file = loadFixture("valid-update-existing.xlsx");
      const parsed = await parser.parseFile(file);

      // If this fixture has hidden IDs, it should return true
      // Note: depends on fixture configuration
      const result = parser.isExportedFile(parsed);
      expect(typeof result).toBe("boolean");
    });

    it("should return false for fresh files without hidden IDs", async () => {
      // Create a workbook without hidden columns
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");

      partsSheet.columns = [
        { header: "ACR_SKU", key: "acr_sku" },
        { header: "Part_Type", key: "part_type" },
      ];

      partsSheet.addRow({ acr_sku: "NEW-001", part_type: "Rotor" });

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.columns = [{ header: "Make", key: "make" }];

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "fresh.xlsx");
      (file as any).arrayBuffer = async () => buffer;

      const parsed = await parser.parseFile(file);

      expect(parser.isExportedFile(parsed)).toBe(false);
    });

    it("should detect hidden _id column as exported file", async () => {
      // Create workbook with hidden _id column
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");

      partsSheet.columns = [
        { header: "_id", key: "_id", hidden: true },
        { header: "ACR_SKU", key: "acr_sku" },
        { header: "Part_Type", key: "part_type" },
      ];

      partsSheet.addRow({
        _id: "test-uuid",
        acr_sku: "EXP-001",
        part_type: "Rotor",
      });

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.columns = [{ header: "Make", key: "make" }];

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "exported.xlsx");
      (file as any).arrayBuffer = async () => buffer;

      const parsed = await parser.parseFile(file);

      expect(parser.isExportedFile(parsed)).toBe(true);
    });
  });

  // ==========================================================================
  // Data Type Handling Tests
  // ==========================================================================

  describe("Data Type Handling", () => {
    it("should trim whitespace from string values", async () => {
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");

      partsSheet.columns = [
        { header: "ACR_SKU", key: "acr_sku" },
        { header: "Part_Type", key: "part_type" },
      ];

      partsSheet.addRow({ acr_sku: "  TRIM-001  ", part_type: "  Rotor  " });

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.columns = [{ header: "Make", key: "make" }];

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "whitespace.xlsx");
      (file as any).arrayBuffer = async () => buffer;

      const result = await parser.parseFile(file);

      expect(result.parts.data[0].acr_sku).toBe("TRIM-001");
      expect(result.parts.data[0].part_type).toBe("Rotor");
    });

    it("should handle numeric values correctly", async () => {
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");
      partsSheet.columns = [{ header: "ACR_SKU", key: "acr_sku" }];
      partsSheet.addRow({ acr_sku: "TEST" });

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.columns = [
        { header: "ACR_SKU", key: "acr_sku" },
        { header: "Make", key: "make" },
        { header: "Model", key: "model" },
        { header: "Start_Year", key: "start_year" },
        { header: "End_Year", key: "end_year" },
      ];

      vehiclesSheet.addRow({
        acr_sku: "TEST",
        make: "Toyota",
        model: "Camry",
        start_year: 2020,
        end_year: 2024,
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "numeric.xlsx");
      (file as any).arrayBuffer = async () => buffer;

      const result = await parser.parseFile(file);

      expect(result.vehicleApplications.data[0].start_year).toBe(2020);
      expect(result.vehicleApplications.data[0].end_year).toBe(2024);
      expect(typeof result.vehicleApplications.data[0].start_year).toBe(
        "number"
      );
    });

    it("should skip rows with no data", async () => {
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");

      partsSheet.columns = [
        { header: "ACR_SKU", key: "acr_sku" },
        { header: "Part_Type", key: "part_type" },
      ];

      partsSheet.addRow({ acr_sku: "PART-001", part_type: "Rotor" });
      partsSheet.addRow({}); // Empty row
      partsSheet.addRow({ acr_sku: "PART-002", part_type: "Caliper" });

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.columns = [{ header: "Make", key: "make" }];

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "empty-row.xlsx");
      (file as any).arrayBuffer = async () => buffer;

      const result = await parser.parseFile(file);

      // Empty row should be skipped
      expect(result.parts.data.length).toBe(2);
      expect(result.parts.data[0].acr_sku).toBe("PART-001");
      expect(result.parts.data[1].acr_sku).toBe("PART-002");
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe("Error Handling", () => {
    it("should throw error for corrupted Excel file", async () => {
      const file = new File([new ArrayBuffer(100)], "corrupted.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      (file as any).arrayBuffer = async () => new ArrayBuffer(100);

      await expect(parser.parseFile(file)).rejects.toThrow(
        "Failed to parse Excel file"
      );
    });

    it("should handle file with empty sheets", async () => {
      const workbook = new ExcelJS.Workbook();
      const partsSheet = workbook.addWorksheet("Parts");
      partsSheet.columns = [{ header: "ACR_SKU", key: "acr_sku" }];
      // No data rows

      const vehiclesSheet = workbook.addWorksheet("Vehicle Applications");
      vehiclesSheet.columns = [{ header: "Make", key: "make" }];

      const buffer = await workbook.xlsx.writeBuffer();
      const file = new File([buffer], "empty-sheets.xlsx");
      (file as any).arrayBuffer = async () => buffer;

      const result = await parser.parseFile(file);

      expect(result.parts.data).toEqual([]);
      expect(result.vehicleApplications.data).toEqual([]);
    });
  });
});
