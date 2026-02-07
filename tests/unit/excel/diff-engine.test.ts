/**
 * DiffEngine Unit Tests
 *
 * Tests ID-based change detection for the 3-sheet Excel format:
 * - Parts (with inline brand columns for cross-refs)
 * - Vehicle Applications
 * - Vehicle Aliases
 *
 * Cross-references are in Parts sheet as brand columns:
 * - National_SKUs, ATV_SKUs, SYD_SKUs, etc.
 * - Supports semicolon-separated AND space-delimited (legacy) formats
 * - Use [DELETE]SKU to explicitly mark a SKU for deletion (ML-style)
 *
 * Key behaviors tested:
 * - ADD: New SKUs in brand column → create cross_references
 * - DELETE: Only SKUs with [DELETE] prefix → delete from DB
 * - UNCHANGED: SKUs in DB but not in Excel → NO ACTION (ML-style safe)
 * - workflow_status: ACTIVE/INACTIVE/DELETE field handling
 */

import { DiffEngine } from "../../../src/services/excel/diff/DiffEngine";
import { DiffOperation } from "../../../src/services/excel/diff/types";
import type {
  ParsedExcelFile,
  ExcelPartRow,
  ExcelVehicleAppRow,
} from "../../../src/services/excel/shared/types";
import type { ExistingDatabaseData } from "../../../src/services/excel/validation/ValidationEngine";

describe("DiffEngine", () => {
  let diffEngine: DiffEngine;

  beforeEach(() => {
    diffEngine = new DiffEngine();
  });

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  function createParsedFile(
    parts: ExcelPartRow[],
    vehicles: ExcelVehicleAppRow[] = []
  ): ParsedExcelFile {
    return {
      parts: {
        sheetName: "Parts",
        data: parts,
        rowCount: parts.length,
      },
      vehicleApplications: {
        sheetName: "Vehicle Applications",
        data: vehicles,
        rowCount: vehicles.length,
      },
      metadata: {
        uploadedAt: new Date(),
        fileName: "test.xlsx",
        fileSize: 1000,
      },
    };
  }

  function createExistingData(
    parts: Map<string, ExcelPartRow> = new Map(),
    vehicles: Map<string, ExcelVehicleAppRow> = new Map(),
    crossRefs: Map<string, { _id: string; acr_part_id: string; competitor_brand: string; competitor_sku: string }> = new Map(),
    partSkus: Set<string> = new Set()
  ): ExistingDatabaseData {
    return {
      parts,
      vehicleApplications: vehicles,
      crossReferences: crossRefs,
      partSkus,
      aliases: new Map(),
    };
  }

  // ==========================================================================
  // BRAND COLUMN PARSING TESTS
  // ==========================================================================

  describe("Brand Column Parsing", () => {
    it("should ADD new cross-refs from brand column SKUs", () => {
      // Part with National_SKUs column containing new SKUs
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "NAT-100;NAT-200", // Two new SKUs
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map(), // No existing cross-refs
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should have 2 cross-ref ADDs (NAT-100 and NAT-200)
      expect(result.crossReferences.adds.length).toBe(2);
      expect(result.crossReferences.adds[0].operation).toBe(DiffOperation.ADD);
      expect(result.crossReferences.adds[0].brand).toBe("NATIONAL");
      expect(
        result.crossReferences.adds.map((a) => a.sku)
      ).toContain("NAT-100");
      expect(
        result.crossReferences.adds.map((a) => a.sku)
      ).toContain("NAT-200");
    });

    it("should DELETE cross-refs only when marked with [DELETE] prefix", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "[DELETE]NAT-100;NAT-200", // DELETE NAT-100, keep NAT-200
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      // Existing cross-ref for NAT-100
      const existingCrossRef = {
        _id: "crossref-uuid-1",
        acr_part_id: "part-uuid-1",
        competitor_brand: "NATIONAL",
        competitor_sku: "NAT-100",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map([["crossref-uuid-1", existingCrossRef]]),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should DELETE NAT-100
      expect(result.crossReferences.deletes.length).toBe(1);
      expect(result.crossReferences.deletes[0].operation).toBe(
        DiffOperation.DELETE
      );
      expect(result.crossReferences.deletes[0].sku).toBe("NAT-100");

      // Should ADD NAT-200
      expect(result.crossReferences.adds.length).toBe(1);
      expect(result.crossReferences.adds[0].sku).toBe("NAT-200");
    });

    it("should NOT auto-delete cross-refs when empty brand column (ML-style safe)", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "", // Empty column - should NOT delete existing
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      // Existing cross-ref
      const existingCrossRef = {
        _id: "crossref-uuid-1",
        acr_part_id: "part-uuid-1",
        competitor_brand: "NATIONAL",
        competitor_sku: "NAT-100",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map([["crossref-uuid-1", existingCrossRef]]),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should NOT delete - ML-style safe behavior
      expect(result.crossReferences.deletes.length).toBe(0);
      expect(result.crossReferences.adds.length).toBe(0);
    });

    it("should handle multiple brands in same part row", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "NAT-100",
        atv_skus: "ATV-200",
        tmk_skus: "TMK-300;TMK-301",
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map(),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should ADD 4 cross-refs total
      expect(result.crossReferences.adds.length).toBe(4);

      const brands = result.crossReferences.adds.map((a) => a.brand);
      expect(brands).toContain("NATIONAL");
      expect(brands).toContain("ATV");
      expect(brands).toContain("TMK");
      expect(brands.filter((b) => b === "TMK").length).toBe(2); // TMK-300 and TMK-301
    });

    it("should not duplicate existing cross-refs", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "NAT-100;NAT-200", // NAT-100 already exists
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      // NAT-100 already exists
      const existingCrossRef = {
        _id: "crossref-uuid-1",
        acr_part_id: "part-uuid-1",
        competitor_brand: "NATIONAL",
        competitor_sku: "NAT-100",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map([["crossref-uuid-1", existingCrossRef]]),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should only ADD NAT-200 (not NAT-100 which already exists)
      expect(result.crossReferences.adds.length).toBe(1);
      expect(result.crossReferences.adds[0].sku).toBe("NAT-200");

      // NAT-100 should be unchanged
      expect(result.crossReferences.deletes.length).toBe(0);
    });
  });

  // ==========================================================================
  // PARTS SHEET - ML-STYLE SAFE DELETE TESTS
  // ==========================================================================

  describe("Parts Sheet - ML-style Safe Delete", () => {
    it("should DELETE parts only with explicit Status=Eliminar marker", () => {
      const partToDelete: ExcelPartRow = {
        _id: "part-uuid-1",
        status: "Eliminar", // Explicit delete marker
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map(),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([partToDelete]);
      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.parts.deletes.length).toBe(1);
      expect(result.parts.deletes[0].operation).toBe(DiffOperation.DELETE);
      expect(result.parts.deletes[0].before?.acr_sku).toBe("ACR15001");
    });

    it("should NOT auto-delete parts missing from file (ML-style safe)", () => {
      // Upload empty Parts sheet - should NOT delete existing parts
      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map(),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([]); // Empty file
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should NOT delete - ML-style safe behavior
      expect(result.parts.deletes.length).toBe(0);

      // Existing part should be UNCHANGED
      expect(result.parts.unchanged.length).toBe(1);
    });
  });

  // ==========================================================================
  // VEHICLE APPLICATIONS - ML-STYLE SAFE DELETE TESTS
  // ==========================================================================

  describe("Vehicle Applications - ML-style Safe Delete", () => {
    it("should NOT auto-delete vehicle applications missing from file", () => {
      const existingVehicle: ExcelVehicleAppRow = {
        _id: "vehicle-uuid-1",
        _part_id: "part-uuid-1",
        acr_sku: "ACR15001",
        make: "TOYOTA",
        model: "CAMRY",
        start_year: 2020,
        end_year: 2024,
      };

      const existingData = createExistingData(
        new Map(),
        new Map([["vehicle-uuid-1", existingVehicle]]),
        new Map(),
        new Set()
      );

      const parsed = createParsedFile([], []); // Empty file
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should NOT delete - ML-style safe behavior
      expect(result.vehicleApplications.deletes.length).toBe(0);

      // Existing vehicle should be UNCHANGED
      expect(result.vehicleApplications.unchanged.length).toBe(1);
    });
  });

  // ==========================================================================
  // SUMMARY TESTS
  // ==========================================================================

  describe("Summary Calculations", () => {
    it("should correctly count cross-ref changes from brand columns", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "NAT-100;[DELETE]NAT-OLD", // 1 ADD, 1 DELETE
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      // Existing cross-ref to delete
      const existingCrossRef = {
        _id: "crossref-uuid-1",
        acr_part_id: "part-uuid-1",
        competitor_brand: "NATIONAL",
        competitor_sku: "NAT-OLD",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map([["crossref-uuid-1", existingCrossRef]]),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Check cross-ref summary
      expect(result.crossReferences.summary.totalAdds).toBe(1);
      expect(result.crossReferences.summary.totalDeletes).toBe(1);
      expect(result.crossReferences.summary.totalChanges).toBe(2);

      // Check overall summary includes cross-ref changes
      expect(result.summary.changesBySheet.crossReferences).toBe(2);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle whitespace in brand column values", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "  NAT-100 ; NAT-200  ;  [DELETE]NAT-OLD ", // Extra spaces
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      const existingCrossRef = {
        _id: "crossref-uuid-1",
        acr_part_id: "part-uuid-1",
        competitor_brand: "NATIONAL",
        competitor_sku: "NAT-OLD",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map([["crossref-uuid-1", existingCrossRef]]),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should handle whitespace correctly
      expect(result.crossReferences.adds.length).toBe(2); // NAT-100, NAT-200
      expect(result.crossReferences.deletes.length).toBe(1); // NAT-OLD
    });

    it("should skip new parts without IDs for cross-ref processing", () => {
      const newPart: ExcelPartRow = {
        _id: "", // New part, no ID yet
        acr_sku: "ACR-NEW",
        part_type: "Wheel Hub",
        national_skus: "NAT-100", // Has cross-ref data
      };

      const existingData = createExistingData();

      const parsed = createParsedFile([newPart]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // New part should be added
      expect(result.parts.adds.length).toBe(1);

      // Cross-refs should NOT be processed (part has no ID yet)
      // They'll be processed on a subsequent import after part is created
      expect(result.crossReferences.adds.length).toBe(0);
    });

    it("should handle empty [DELETE] marker (no SKU after marker)", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "NAT-100;[DELETE];NAT-200", // Empty delete marker
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map(),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should only add valid SKUs
      expect(result.crossReferences.adds.length).toBe(2); // NAT-100, NAT-200
      expect(result.crossReferences.deletes.length).toBe(0); // Empty marker ignored
    });

    it("should handle space-delimited SKUs (legacy format)", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "NAT-100 NAT-200 NAT-300", // Space-delimited (legacy)
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map(),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Should parse all 3 space-delimited SKUs
      expect(result.crossReferences.adds.length).toBe(3);
      const skus = result.crossReferences.adds.map((a) => a.sku);
      expect(skus).toContain("NAT-100");
      expect(skus).toContain("NAT-200");
      expect(skus).toContain("NAT-300");
    });

    it("should handle mixed semicolon and space delimiters (semicolon takes precedence)", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        national_skus: "NAT-100; NAT-200 NAT-300", // Semicolon present - only split on semicolons
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map(),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // When semicolon is present, only split on semicolons
      // "NAT-100" and "NAT-200 NAT-300" (second item includes space)
      expect(result.crossReferences.adds.length).toBe(2);
      const skus = result.crossReferences.adds.map((a) => a.sku);
      expect(skus).toContain("NAT-100");
      expect(skus).toContain("NAT-200 NAT-300"); // Treated as single SKU
    });
  });

  // ==========================================================================
  // WORKFLOW STATUS TESTS
  // ==========================================================================

  describe("Workflow Status Handling", () => {
    it("should detect UPDATE when workflow_status changes", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        workflow_status: "INACTIVE", // Changed from ACTIVE
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        workflow_status: "ACTIVE",
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map(),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.parts.updates.length).toBe(1);
      expect(result.parts.updates[0].operation).toBe(DiffOperation.UPDATE);
      expect(result.parts.updates[0].after?.workflow_status).toBe("INACTIVE");
    });

    it("should handle all valid workflow_status values", () => {
      const statuses = ["ACTIVE", "INACTIVE", "DELETE"];

      for (const status of statuses) {
        const part: ExcelPartRow = {
          _id: "part-uuid-1",
          acr_sku: "ACR15001",
          part_type: "Wheel Hub",
          workflow_status: status,
        };

        const existingPart: ExcelPartRow = {
          _id: "part-uuid-1",
          acr_sku: "ACR15001",
          part_type: "Wheel Hub",
          workflow_status: "ACTIVE",
        };

        const existingData = createExistingData(
          new Map([["part-uuid-1", existingPart]]),
          new Map(),
          new Map(),
          new Set(["ACR15001"])
        );

        const parsed = createParsedFile([part]);
        const result = diffEngine.generateDiff(parsed, existingData);

        if (status === "ACTIVE") {
          expect(result.parts.unchanged.length).toBe(1);
        } else {
          expect(result.parts.updates.length).toBe(1);
        }
      }
    });

    it("should treat empty workflow_status as null (normalized comparison)", () => {
      const part: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        workflow_status: "", // Empty string
      };

      const existingPart: ExcelPartRow = {
        _id: "part-uuid-1",
        acr_sku: "ACR15001",
        part_type: "Wheel Hub",
        workflow_status: undefined, // Undefined in DB
      };

      const existingData = createExistingData(
        new Map([["part-uuid-1", existingPart]]),
        new Map(),
        new Map(),
        new Set(["ACR15001"])
      );

      const parsed = createParsedFile([part]);
      const result = diffEngine.generateDiff(parsed, existingData);

      // Empty and undefined should be treated as equivalent (no change)
      expect(result.parts.unchanged.length).toBe(1);
      expect(result.parts.updates.length).toBe(0);
    });
  });
});
