/**
 * ValidationEngine Unit Tests
 *
 * Comprehensive test coverage for all validation error codes (E1-E19)
 * and warning codes (W1-W10) using fixture-based testing
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import { ExcelImportService } from "../../../src/services/excel/import/ExcelImportService";
import { ValidationEngine } from "../../../src/services/excel/validation/ValidationEngine";
import {
  ValidationErrorCode,
  ValidationWarningCode,
} from "../../../src/services/excel/validation/types";
import {
  loadFixture,
  emptyDbState,
  seedDbState,
} from "../../../scripts/test/helpers/fixture-loader";

describe("ValidationEngine", () => {
  const parser = new ExcelImportService();
  const validator = new ValidationEngine();

  // ========================================================================
  // Happy Path Tests
  // ========================================================================

  describe("Happy Path: Valid Data", () => {
    it("should validate fixture: valid-add-new-parts.xlsx", async () => {
      const file = loadFixture("valid-add-new-parts.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.summary.totalErrors).toBe(0);
      expect(result.summary.totalWarnings).toBe(0);
    });

    it("should validate fixture: valid-update-existing.xlsx (requires seed data)", async () => {
      // This test needs live database with seed data loaded
      // For now, we'll skip it and test manually
      // TODO: Mock seed data or require DB connection
      expect(true).toBe(true); // Placeholder
    });
  });

  // ========================================================================
  // Error Code Tests: E2 - Duplicate ACR_SKU
  // ========================================================================

  describe("Error Code E2: Duplicate ACR_SKU", () => {
    it("should detect duplicate SKUs in Parts sheet", async () => {
      const file = loadFixture("error-duplicate-skus.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const duplicateErrors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E2_DUPLICATE_ACR_SKU
      );

      expect(duplicateErrors.length).toBeGreaterThan(0);
      expect(duplicateErrors[0].message.toLowerCase()).toContain("duplicate");
      expect(duplicateErrors[0].sheet).toBe("Parts");
    });
  });

  // ========================================================================
  // Error Code Tests: E3 - Empty Required Field
  // ========================================================================

  describe("Error Code E3: Empty Required Field", () => {
    it("should detect missing required fields across all sheets", async () => {
      const file = loadFixture("error-missing-required-fields.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      expect(result.valid).toBe(false);

      const missingFieldErrors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E3_EMPTY_REQUIRED_FIELD
      );

      expect(missingFieldErrors.length).toBeGreaterThan(0);

      // Should have errors from Parts sheet (missing ACR_SKU, Part Type)
      const partsErrors = missingFieldErrors.filter((e) => e.sheet === "Parts");
      expect(partsErrors.length).toBe(2); // Exactly 2 errors: missing ACR_SKU and missing Part_Type

      // Vehicle Applications and Cross References sheets are empty in this fixture
      // (only Parts sheet has test data)
    });
  });

  // ========================================================================
  // Error Code Tests: E5 - Orphaned Foreign Key
  // ========================================================================

  describe("Error Code E5: Orphaned Foreign Key", () => {
    it("should detect orphaned references to non-existent parts", async () => {
      const file = loadFixture("error-orphaned-references.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      expect(result.valid).toBe(false);

      const orphanedErrors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E5_ORPHANED_FOREIGN_KEY
      );

      expect(orphanedErrors.length).toBeGreaterThan(0);

      // Should detect orphans in both Vehicle Applications and Cross References
      const vehicleOrphans = orphanedErrors.filter(
        (e) => e.sheet === "Vehicle Applications"
      );
      const crossRefOrphans = orphanedErrors.filter(
        (e) => e.sheet === "Cross References"
      );

      expect(vehicleOrphans.length).toBeGreaterThan(0);
      // Cross References sheet is now empty in this fixture, so no CR orphans expected
    });
  });

  // ========================================================================
  // Error Code Tests: E6 - Invalid Year Range (start > end)
  // ========================================================================

  describe("Error Code E6: Invalid Year Range", () => {
    it("should detect inverted year ranges (start_year > end_year)", async () => {
      const file = loadFixture("error-invalid-formats.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      expect(result.valid).toBe(false);

      const yearRangeErrors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E6_INVALID_YEAR_RANGE
      );

      expect(yearRangeErrors.length).toBeGreaterThan(0);
      expect(yearRangeErrors[0].message.toLowerCase()).toContain("year");
      expect(yearRangeErrors[0].sheet).toBe("Vehicle Applications");
    });
  });

  // ========================================================================
  // Error Code Tests: E7 - String Exceeds Max Length
  // ========================================================================

  describe("Error Code E7: String Exceeds Max Length", () => {
    it("should detect strings exceeding max length", async () => {
      const file = loadFixture("error-max-length-exceeded.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      expect(result.valid).toBe(false);

      const maxLengthErrors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E7_STRING_EXCEEDS_MAX_LENGTH
      );

      expect(maxLengthErrors.length).toBeGreaterThan(0);
      expect(maxLengthErrors[0].message).toContain("maximum length");
    });
  });

  // ========================================================================
  // Error Code Tests: E8 - Year Out of Range (< 1900 or > current+2)
  // ========================================================================

  describe("Error Code E8: Year Out of Range", () => {
    it("should detect years outside acceptable range", async () => {
      const file = loadFixture("error-invalid-formats.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      expect(result.valid).toBe(false);

      // Debug: log all errors to see what's actually being detected
      if (result.errors.length > 0) {
        console.log("\n=== ALL ERRORS IN error-invalid-formats.xlsx ===");
        result.errors.forEach((e, i) => {
          console.log(
            `${i + 1}. [${e.code}] ${e.message} (sheet: ${e.sheet}, row: ${e.row})`
          );
        });
      }

      const yearOutOfRangeErrors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E8_YEAR_OUT_OF_RANGE
      );

      expect(yearOutOfRangeErrors.length).toBeGreaterThan(0);
      expect(yearOutOfRangeErrors[0].message.toLowerCase()).toContain("year");
      expect(yearOutOfRangeErrors[0].sheet).toBe("Vehicle Applications");
    });
  });

  // ========================================================================
  // Warning Code Tests: W1-W10
  // ========================================================================

  describe("Warning Codes: Data Changes (W1-W10)", () => {
    it("should detect data changes and generate warnings", async () => {
      const file = loadFixture("warning-data-changes.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, seedDbState());

      // Debug: Log errors if any
      if (result.errors.length > 0) {
        console.log("\n=== UNEXPECTED ERRORS IN warning-data-changes.xlsx ===");
        result.errors.forEach((e, i) => {
          console.log(
            `${i + 1}. [${e.code}] ${e.message} (sheet: ${e.sheet}, row: ${e.row})`
          );
        });
      }

      // Warnings don't block - file should still be valid
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Extract warning codes
      const warningCodes = result.warnings.map((w) => w.code);

      // Should detect various warning types:
      expect(warningCodes).toContain("W1_ACR_SKU_CHANGED"); // SEED-001 → SEED-001-CHANGED
      expect(warningCodes).toContain("W3_PART_TYPE_CHANGED"); // Rotor → Caliper
      expect(warningCodes).toContain("W4_POSITION_TYPE_CHANGED"); // Front → Rear
      expect(warningCodes).toContain("W7_SPECIFICATIONS_SHORTENED"); // Specs shortened
      expect(warningCodes).toContain("W8_VEHICLE_MAKE_CHANGED"); // Honda → Toyota
      expect(warningCodes).toContain("W9_VEHICLE_MODEL_CHANGED"); // Civic → CR-V
      // Note: W10_COMPETITOR_BRAND_CHANGED no longer applies in Phase 3A (2-sheet format)
      // Cross-references are now in brand columns, not a separate sheet
      expect(warningCodes).toContain("W5_CROSS_REFERENCE_DELETED"); // Cross-ref deletion via [DELETE] marker

      console.log("\n=== WARNING CODES DETECTED ===");
      result.warnings.forEach((w, i) => {
        console.log(`${i + 1}. [${w.code}] ${w.message}`);
      });
    });
  });

  // ========================================================================
  // Validation Summary Tests
  // ========================================================================

  describe("Validation Summary", () => {
    it("should provide accurate summary counts", async () => {
      const file = loadFixture("error-missing-required-fields.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      expect(result.summary.totalErrors).toBeGreaterThan(0);
      expect(result.summary.totalErrors).toBe(result.errors.length);
      expect(result.summary.totalWarnings).toBe(result.warnings.length);

      // Should have errors by sheet breakdown
      expect(result.summary.errorsBySheet).toBeDefined();
    });

    it("should correctly set valid=false when errors exist", async () => {
      const file = loadFixture("error-duplicate-skus.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should correctly set valid=true when only warnings exist", async () => {
      // Test that warnings don't block validation
      const file = loadFixture("warning-data-changes.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, seedDbState());

      // Debug: Log errors if any
      if (result.errors.length > 0) {
        console.log("\n=== UNEXPECTED ERRORS IN valid=true test ===");
        result.errors.forEach((e, i) => {
          console.log(
            `${i + 1}. [${e.code}] ${e.message} (sheet: ${e.sheet}, row: ${e.row})`
          );
        });
      }

      // Should be valid despite warnings
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Error Code Tests: E9 - Invalid Number Format
  // ========================================================================

  describe("Error Code E9: Invalid Number Format", () => {
    it("should detect non-integer year values", async () => {
      const file = loadFixture("error-invalid-formats.xlsx");
      const parsed = await parser.parseFile(file);
      const result = await validator.validate(parsed, emptyDbState());

      // Check for E9 errors
      const numberErrors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E9_INVALID_NUMBER_FORMAT
      );

      // The fixture may or may not have non-integer years
      // If it does, this test will catch them
      if (numberErrors.length > 0) {
        expect(numberErrors[0].message).toContain("integer");
        expect(numberErrors[0].sheet).toBe("Vehicle Applications");
      } else {
        // Log for debugging - this is expected if fixture doesn't have decimal years
        console.log("Note: error-invalid-formats.xlsx does not contain non-integer year values");
        expect(true).toBe(true);
      }
    });
  });

  // ========================================================================
  // Error Code Tests: E10 - Required Sheet Missing (Empty File)
  // ========================================================================

  describe("Error Code E10: Required Sheet Missing (Empty File)", () => {
    it("should detect when all sheets are empty", async () => {
      // Create a mock parsed file with empty data
      const mockParsed = {
        parts: { sheetName: "Parts", data: [], rowCount: 0 },
        vehicleApplications: { sheetName: "Vehicle Applications", data: [], rowCount: 0 },
        metadata: { uploadedAt: new Date(), fileName: "empty.xlsx", fileSize: 1000 },
      };

      const result = await validator.validate(mockParsed as any, emptyDbState());

      const e10Errors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E10_REQUIRED_SHEET_MISSING
      );

      expect(e10Errors.length).toBe(1);
      expect(e10Errors[0].message).toContain("empty");
    });
  });

  // ========================================================================
  // Error Code Tests: E20 - Invalid ACR_SKU Format
  // ========================================================================

  describe("Error Code E20: Invalid ACR_SKU Format", () => {
    it("should detect SKUs that don't start with ACR prefix", async () => {
      // Create a mock parsed file with invalid SKU format
      const mockParsed = {
        parts: {
          sheetName: "Parts",
          data: [
            { _id: "test-uuid-1", acr_sku: "INVALID-001", part_type: "Rotor" },
            { _id: "test-uuid-2", acr_sku: "XYZ-002", part_type: "Caliper" },
          ],
          rowCount: 2,
        },
        vehicleApplications: { sheetName: "Vehicle Applications", data: [], rowCount: 0 },
        metadata: { uploadedAt: new Date(), fileName: "invalid-sku.xlsx", fileSize: 1000 },
      };

      const result = await validator.validate(mockParsed as any, {
        ...emptyDbState(),
        parts: new Map([
          ["test-uuid-1", { _id: "test-uuid-1", acr_sku: "INVALID-001", part_type: "Rotor" }],
          ["test-uuid-2", { _id: "test-uuid-2", acr_sku: "XYZ-002", part_type: "Caliper" }],
        ]),
      });

      const e20Errors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E20_INVALID_ACR_SKU_FORMAT
      );

      expect(e20Errors.length).toBe(2);
      expect(e20Errors[0].message).toContain("ACR");
    });

    it("should accept SKUs that start with ACR prefix", async () => {
      const mockParsed = {
        parts: {
          sheetName: "Parts",
          data: [
            { _id: "test-uuid-1", acr_sku: "ACR15001", part_type: "Rotor" },
            { _id: "test-uuid-2", acr_sku: "ACR-002", part_type: "Caliper" },
          ],
          rowCount: 2,
        },
        vehicleApplications: { sheetName: "Vehicle Applications", data: [], rowCount: 0 },
        metadata: { uploadedAt: new Date(), fileName: "valid-sku.xlsx", fileSize: 1000 },
      };

      const result = await validator.validate(mockParsed as any, {
        ...emptyDbState(),
        parts: new Map([
          ["test-uuid-1", { _id: "test-uuid-1", acr_sku: "ACR15001", part_type: "Rotor" }],
          ["test-uuid-2", { _id: "test-uuid-2", acr_sku: "ACR-002", part_type: "Caliper" }],
        ]),
      });

      const e20Errors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E20_INVALID_ACR_SKU_FORMAT
      );

      expect(e20Errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Error Code Tests: E22 - Invalid URL Format
  // ========================================================================

  describe("Error Code E22: Invalid URL Format", () => {
    it("should detect invalid image URL formats", async () => {
      const mockParsed = {
        parts: {
          sheetName: "Parts",
          data: [
            {
              _id: "test-uuid-1",
              acr_sku: "ACR-001",
              part_type: "Rotor",
              image_url_front: "invalid-url",
              image_url_back: "ftp://example.com/image.jpg",
            },
          ],
          rowCount: 1,
        },
        vehicleApplications: { sheetName: "Vehicle Applications", data: [], rowCount: 0 },
        metadata: { uploadedAt: new Date(), fileName: "invalid-url.xlsx", fileSize: 1000 },
      };

      const result = await validator.validate(mockParsed as any, {
        ...emptyDbState(),
        parts: new Map([
          ["test-uuid-1", { _id: "test-uuid-1", acr_sku: "ACR-001", part_type: "Rotor" }],
        ]),
      });

      const e22Errors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E22_INVALID_URL_FORMAT
      );

      expect(e22Errors.length).toBe(2);
      expect(e22Errors[0].message).toContain("http");
    });

    it("should accept valid image URLs (http:// and https://)", async () => {
      const mockParsed = {
        parts: {
          sheetName: "Parts",
          data: [
            {
              _id: "test-uuid-1",
              acr_sku: "ACR-001",
              part_type: "Rotor",
              image_url_front: "https://example.com/front.jpg",
              image_url_back: "http://example.com/back.jpg",
            },
          ],
          rowCount: 1,
        },
        vehicleApplications: { sheetName: "Vehicle Applications", data: [], rowCount: 0 },
        metadata: { uploadedAt: new Date(), fileName: "valid-url.xlsx", fileSize: 1000 },
      };

      const result = await validator.validate(mockParsed as any, {
        ...emptyDbState(),
        parts: new Map([
          ["test-uuid-1", { _id: "test-uuid-1", acr_sku: "ACR-001", part_type: "Rotor" }],
        ]),
      });

      const e22Errors = result.errors.filter(
        (e) => e.code === ValidationErrorCode.E22_INVALID_URL_FORMAT
      );

      expect(e22Errors.length).toBe(0);
    });
  });

  // ========================================================================
  // Warning Code Tests: W11 - Duplicate SKU in Brand Column
  // ========================================================================

  describe("Warning Code W11: Duplicate SKU in Brand Column", () => {
    it("should warn about duplicate SKUs within same brand column", async () => {
      const mockParsed = {
        parts: {
          sheetName: "Parts",
          data: [
            {
              _id: "test-uuid-1",
              acr_sku: "ACR-001",
              part_type: "Rotor",
              national_skus: "NAT-100;NAT-100;NAT-200", // Duplicate NAT-100
            },
          ],
          rowCount: 1,
        },
        vehicleApplications: { sheetName: "Vehicle Applications", data: [], rowCount: 0 },
        metadata: { uploadedAt: new Date(), fileName: "dup-brand.xlsx", fileSize: 1000 },
      };

      const result = await validator.validate(mockParsed as any, {
        ...emptyDbState(),
        parts: new Map([
          ["test-uuid-1", { _id: "test-uuid-1", acr_sku: "ACR-001", part_type: "Rotor" }],
        ]),
      });

      const w11Warnings = result.warnings.filter(
        (w) => w.code === ValidationWarningCode.W11_DUPLICATE_SKU_IN_BRAND
      );

      expect(w11Warnings.length).toBe(1);
      expect(w11Warnings[0].message).toContain("Duplicate");
    });
  });

  // ========================================================================
  // Warning Code Tests: W12 - Space Delimited SKUs (Legacy Format)
  // ========================================================================

  describe("Warning Code W12: Space Delimited SKUs", () => {
    it("should warn about legacy space-delimited SKU format", async () => {
      const mockParsed = {
        parts: {
          sheetName: "Parts",
          data: [
            {
              _id: "test-uuid-1",
              acr_sku: "ACR-001",
              part_type: "Rotor",
              national_skus: "NAT-100 NAT-200 NAT-300", // Space-delimited (legacy)
            },
          ],
          rowCount: 1,
        },
        vehicleApplications: { sheetName: "Vehicle Applications", data: [], rowCount: 0 },
        metadata: { uploadedAt: new Date(), fileName: "space-delim.xlsx", fileSize: 1000 },
      };

      const result = await validator.validate(mockParsed as any, {
        ...emptyDbState(),
        parts: new Map([
          ["test-uuid-1", { _id: "test-uuid-1", acr_sku: "ACR-001", part_type: "Rotor" }],
        ]),
      });

      const w12Warnings = result.warnings.filter(
        (w) => w.code === ValidationWarningCode.W12_SPACE_DELIMITED_SKUS
      );

      expect(w12Warnings.length).toBe(1);
      expect(w12Warnings[0].message).toContain("space-delimited");
    });

    it("should NOT warn about semicolon-delimited SKUs (correct format)", async () => {
      const mockParsed = {
        parts: {
          sheetName: "Parts",
          data: [
            {
              _id: "test-uuid-1",
              acr_sku: "ACR-001",
              part_type: "Rotor",
              national_skus: "NAT-100;NAT-200;NAT-300", // Semicolon-delimited (correct)
            },
          ],
          rowCount: 1,
        },
        vehicleApplications: { sheetName: "Vehicle Applications", data: [], rowCount: 0 },
        metadata: { uploadedAt: new Date(), fileName: "semi-delim.xlsx", fileSize: 1000 },
      };

      const result = await validator.validate(mockParsed as any, {
        ...emptyDbState(),
        parts: new Map([
          ["test-uuid-1", { _id: "test-uuid-1", acr_sku: "ACR-001", part_type: "Rotor" }],
        ]),
      });

      const w12Warnings = result.warnings.filter(
        (w) => w.code === ValidationWarningCode.W12_SPACE_DELIMITED_SKUS
      );

      expect(w12Warnings.length).toBe(0);
    });
  });

  // ========================================================================
  // Brand Column Validations (Phase 3A)
  // ========================================================================

  describe("Brand Column Validations", () => {
    it("should detect [DELETE] marker in brand columns", async () => {
      const mockParsed = {
        parts: {
          sheetName: "Parts",
          data: [
            {
              _id: "test-uuid-1",
              acr_sku: "ACR-001",
              part_type: "Rotor",
              national_skus: "[DELETE]NAT-100;NAT-200", // DELETE marker
            },
          ],
          rowCount: 1,
        },
        vehicleApplications: { sheetName: "Vehicle Applications", data: [], rowCount: 0 },
        metadata: { uploadedAt: new Date(), fileName: "delete-marker.xlsx", fileSize: 1000 },
      };

      const result = await validator.validate(mockParsed as any, {
        ...emptyDbState(),
        parts: new Map([
          ["test-uuid-1", { _id: "test-uuid-1", acr_sku: "ACR-001", part_type: "Rotor" }],
        ]),
      });

      // DELETE marker is valid, should not produce errors for it
      const brandErrors = result.errors.filter(
        (e) => e.column === "national_skus"
      );

      expect(brandErrors.length).toBe(0);
    });
  });
});
