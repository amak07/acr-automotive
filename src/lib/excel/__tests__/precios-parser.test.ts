// Simple tests for PreciosParser - ACR Automotive
import { PreciosParser } from "../precios-parser";
import { PreciosRow } from "../types";
import { CONFLICT_TYPES } from "../conflict-types";
import * as fs from "fs";
import * as path from "path";

describe("PreciosParser", () => {
  describe("extractCompetitorSkus", () => {
    test("should extract competitor SKUs from a row with some empty cells", () => {
      // Create a test row: ACR123, NATIONAL="NAT123", ATV="", TMK="TM123", rest empty
      const testRow = [
        "ID1", // Column A (index 0)
        "ACR512342", // Column B (index 1) - ACR SKU
        "NAT123", // Column C (index 2) - NATIONAL
        "", // Column D (index 3) - ATV (empty)
        undefined, // Column E (index 4) - SYD (undefined)
        "TM123", // Column F (index 5) - TMK
        null, // Column G (index 6) - GROB (null)
        "RACE456", // Column H (index 7) - RACE
        // Rest empty...
      ];

      // Call the private method using array access trick
      const result = (PreciosParser as any).extractCompetitorSkus(testRow);

      // Verify structure
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Find specific competitors
      const national = result.find((c) => c.brand.includes("NATIONAL"));
      const atv = result.find((c) => c.brand === "ATV");
      const tmk = result.find((c) => c.brand === "TMK");
      const race = result.find((c) => c.brand === "RACE");

      // Verify non-empty values
      expect(national?.sku).toBe("NAT123");
      expect(tmk?.sku).toBe("TM123");
      expect(race?.sku).toBe("RACE456");

      // Verify empty/null values become null
      expect(atv?.sku).toBe(null);
    });

    test("should handle completely empty row", () => {
      const emptyRow = new Array(15).fill(undefined);

      const result = (PreciosParser as any).extractCompetitorSkus(emptyRow);

      expect(Array.isArray(result)).toBe(true);
      // All SKUs should be null
      result.forEach((competitor: { sku: string | null; brand: string }) => {
        expect(competitor.sku).toBe(null);
        expect(typeof competitor.brand).toBe("string");
      });
    });
  });

  describe("extractAcrSkus", () => {
    test("should extract unique valid ACR SKUs", () => {
      const testRows: PreciosRow[] = [
        {
          acrSku: "ACR512342",
          competitors: [],
          rowNumber: 9,
        },
        {
          acrSku: "ACR512343",
          competitors: [],
          rowNumber: 10,
        },
        {
          acrSku: "ACR512342", // Duplicate - should be deduplicated
          competitors: [],
          rowNumber: 11,
        },
        {
          acrSku: "INVALID123", // Invalid - should be filtered out
          competitors: [],
          rowNumber: 12,
        },
      ];

      const result = (PreciosParser as any).extractAcrSkus(testRows);

      expect(result instanceof Set).toBe(true);
      expect(result.size).toBe(2); // Only 2 unique valid ACR SKUs
      expect(result.has("ACR512342")).toBe(true);
      expect(result.has("ACR512343")).toBe(true);
      expect(result.has("INVALID123")).toBe(false);
    });
  });

  describe("isValidAcrSku", () => {
    test("should validate ACR SKU format", () => {
      // Test valid SKUs
      expect((PreciosParser as any).isValidAcrSku("ACR512342")).toBe(true);
      expect((PreciosParser as any).isValidAcrSku("ACR123")).toBe(true);

      // Test invalid SKUs
      expect((PreciosParser as any).isValidAcrSku("TM512342")).toBe(false);
      expect((PreciosParser as any).isValidAcrSku("512342")).toBe(false);
      expect((PreciosParser as any).isValidAcrSku("")).toBe(false);
    });
  });

  describe("transformToCrossReferences", () => {
    test("should transform PreciosRows to CrossReferences correctly", () => {
      const testRows: PreciosRow[] = [
        {
          acrSku: "ACR512342",
          competitors: [
            { brand: "TMK", sku: "TM512342" },
            { brand: "NATIONAL", sku: null }, // Empty competitor
            { brand: "GSP", sku: "GSP123" },
          ],
          rowNumber: 9,
        },
      ];

      const result = (PreciosParser as any).transformToCrossReferences(
        testRows
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // Only non-null competitors

      // Check first cross-reference
      expect(result[0]).toEqual({
        acrSku: "ACR512342",
        competitorBrand: "TMK",
        competitorSku: "TM512342",
      });

      // Check second cross-reference
      expect(result[1]).toEqual({
        acrSku: "ACR512342",
        competitorBrand: "GSP",
        competitorSku: "GSP123",
      });
    });
  });

  describe("parseRow", () => {
    test("should parse a valid row into PreciosRow", () => {
      const testRow = [
        "ID1", // Column A
        "ACR512342", // Column B - ACR SKU
        "NAT123", // Column C - NATIONAL
        "ATV456", // Column D - ATV
        // ... more columns
      ];

      const result = (PreciosParser as any).parseRow(testRow, 9);

      expect(result).not.toBe(null);
      expect(result.acrSku).toBe("ACR512342");
      expect(result.rowNumber).toBe(9);
      expect(Array.isArray(result.competitors)).toBe(true);
    });

    test("should return null for row without ACR SKU", () => {
      const invalidRow = [
        "ID1", // Column A
        "", // Column B - Empty ACR SKU
        "NAT123", // Column C
      ];

      const result = (PreciosParser as any).parseRow(invalidRow, 9);

      expect(result).toBe(null);
    });
  });

  // Integration test - tests multiple methods working together
  describe("Integration Test", () => {
    test("should process a complete mini dataset", () => {
      // Create test data that mimics real Excel structure
      const testData = [
        // Row 1: Complete data
        ["ID1", "ACR512342", "NAT123", "", "SYD456", "TM512342", "", "RACE789"],
        // Row 2: Partial data
        ["ID2", "ACR512343", "", "ATV999", "", "TM512343", "GROB111"],
        // Row 3: Invalid ACR SKU (should be filtered)
        ["ID3", "INVALID", "NAT999"],
      ];

      // Test parseRows method
      const preciosRows = (PreciosParser as any).parseRows(testData);

      expect(preciosRows.length).toBe(2); // Invalid row filtered out

      // Test transformToCrossReferences
      const crossRefs = (PreciosParser as any).transformToCrossReferences(
        preciosRows
      );

      expect(crossRefs.length).toBeGreaterThan(0);

      // Test extractAcrSkus
      const acrSkus = (PreciosParser as any).extractAcrSkus(preciosRows);

      expect(acrSkus.size).toBe(2);
      expect(acrSkus.has("ACR512342")).toBe(true);
      expect(acrSkus.has("ACR512343")).toBe(true);
    });
  });

  // Real Excel file test
  describe("Real Excel File Integration", () => {
    test("should parse the actual PRECIOS Excel file with conflict detection", () => {
      // Load the real Excel file
      const excelFilePath = path.join(
        __dirname,
        "09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx"
      );

      // Check if file exists
      expect(fs.existsSync(excelFilePath)).toBe(true);

      // Read file as buffer - parser now accepts Buffer directly
      const fileBuffer = fs.readFileSync(excelFilePath);
      expect(fileBuffer).toBeDefined();
      expect(fileBuffer.length).toBeGreaterThan(0);

      // Parse the file directly with Buffer
      const result = PreciosParser.parseFile(fileBuffer);

      // ProcessingResult assertions
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.conflicts).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.summary).toBeDefined();

      // Data assertions (now nested under result.data)
      expect(result.data.acrSkus).toBeInstanceOf(Set);
      expect(Array.isArray(result.data.crossReferences)).toBe(true);
      expect(result.data.summary).toBeDefined();

      // Verify we got reasonable data amounts
      expect(result.data.acrSkus.size).toBeGreaterThan(0);
      expect(result.data.crossReferences.length).toBeGreaterThan(0);
      expect(result.data.summary.processingTimeMs).toBeLessThan(5000); // Should be fast

      // Conflict detection assertions
      expect(result.conflicts).toBeInstanceOf(Array);
      console.log('PRECIOS Conflicts found:', result.conflicts.length);
      
      // Check for duplicate conflicts (if any)
      const duplicateConflicts = result.conflicts.filter(c => c.conflictType === CONFLICT_TYPES.DUPLICATE_ACR_SKU);
      if (duplicateConflicts.length > 0) {
        console.log('Found duplicate ACR SKUs:', duplicateConflicts.length);
        duplicateConflicts.forEach(conflict => {
          expect(conflict.severity).toBe('error');
          expect(conflict.impact).toBe('blocking');
          expect(conflict.source).toBe('precios');
        });
      }

      // Verify all ACR SKUs start with "ACR"
      result.data.acrSkus.forEach((sku) => {
        expect(sku.startsWith("ACR")).toBe(true);
      });

      // Verify cross-references have proper structure
      if (result.data.crossReferences.length > 0) {
        const firstCrossRef = result.data.crossReferences[0];
        expect(firstCrossRef.acrSku).toBeDefined();
        expect(firstCrossRef.competitorBrand).toBeDefined();
        expect(firstCrossRef.competitorSku).toBeDefined();
        expect(firstCrossRef.acrSku.startsWith("ACR")).toBe(true);
      }

      console.log('PRECIOS Results:', result.data.summary);
    });

    test("should handle expected data volumes from real file", () => {
      const excelFilePath = path.join(
        __dirname,
        "09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx"
      );
      const fileBuffer = fs.readFileSync(excelFilePath);
      
      // Parse the file directly with Buffer
      const result = PreciosParser.parseFile(fileBuffer);

      // Based on your business analysis, you expect:
      // - Around 753 unique ACR parts (from CATALOGACION analysis)
      // - Multiple cross-references per part

      // Verify reasonable data volumes (adjust based on actual file)
      expect(result.data.acrSkus.size).toBeGreaterThan(100); // At least 100 parts
      expect(result.data.acrSkus.size).toBeLessThan(2000); // Less than 2000 parts

      // Cross-references should be more than parts (multiple competitors per part)
      expect(result.data.crossReferences.length).toBeGreaterThanOrEqual(
        result.data.acrSkus.size
      );

      // Performance check
      expect(result.data.summary.processingTimeMs).toBeLessThan(10000); // Under 10 seconds

      // Check for specific competitor brands
      const brands = new Set(
        result.data.crossReferences.map((ref) => ref.competitorBrand)
      );

      // Should find some of the expected brands
      const expectedBrands = ["TMK", "NATIONAL", "GSP", "GMB"];
      const foundExpectedBrands = expectedBrands.filter((brand) =>
        Array.from(brands).some((foundBrand) => foundBrand.includes(brand))
      );

      expect(foundExpectedBrands.length).toBeGreaterThan(0);
    });
  });
});
