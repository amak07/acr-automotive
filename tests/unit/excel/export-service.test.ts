/**
 * ExcelExportService Unit Tests - Phase 3A (2-Sheet Format)
 *
 * Tests Excel export functionality for the new 2-sheet format:
 * - Parts sheet with inline cross-refs (brand columns) and image URLs
 * - Vehicle Applications sheet
 *
 * Phase 3A changes:
 * - Cross References sheet eliminated
 * - 11 brand columns in Parts sheet (semicolon-separated SKUs)
 * - 4 image URL columns + 360_Viewer_Status in Parts sheet
 *
 * Note: Supabase client is mocked. Integration tests verify actual exports.
 */

import { ExcelExportService } from "../../../src/services/export/ExcelExportService";
import ExcelJS from "exceljs";

// Mock Supabase client
jest.mock("../../../src/lib/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from "../../../src/lib/supabase/client";

describe("ExcelExportService - Phase 3A (2-Sheet Format)", () => {
  let exportService: ExcelExportService;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockOrder: jest.Mock;
  let mockRange: jest.Mock;
  let mockEq: jest.Mock;
  let mockOr: jest.Mock;
  let mockIn: jest.Mock;

  beforeEach(() => {
    exportService = new ExcelExportService();

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock chain
    mockIn = jest.fn();
    mockOr = jest.fn();
    mockEq = jest.fn();
    mockRange = jest.fn();
    mockOrder = jest.fn();
    mockSelect = jest.fn();
    mockFrom = jest.fn();

    // Create chainable mock object
    const chainMock = {
      select: mockSelect,
      order: mockOrder,
      range: mockRange,
      eq: mockEq,
      or: mockOr,
      in: mockIn,
    };

    // Make all methods return the chain
    mockFrom.mockReturnValue(chainMock);
    mockSelect.mockReturnValue(chainMock);
    mockOrder.mockReturnValue(chainMock);
    mockRange.mockReturnValue({ data: [], error: null });
    mockEq.mockReturnValue(chainMock);
    mockOr.mockReturnValue(chainMock);
    mockIn.mockReturnValue(chainMock);

    (supabase.from as jest.Mock) = mockFrom;
  });

  // ==========================================================================
  // WORKBOOK STRUCTURE TESTS - Phase 3A 2-Sheet Format
  // ==========================================================================

  describe("Workbook Structure (Phase 3A)", () => {
    it("should create workbook with 2 sheets (Parts + Vehicle Applications)", async () => {
      // Mock empty database
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      // Parse the buffer to verify structure
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(2);
      expect(workbook.worksheets[0].name).toBe("Parts");
      expect(workbook.worksheets[1].name).toBe("Vehicle Applications");
    });

    it("should NOT have Cross References sheet (Phase 3A eliminates it)", async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.getWorksheet("Cross References")).toBeUndefined();
    });

    it("should set workbook metadata (creator, created date)", async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.creator).toBe("ACR Automotive");
      expect(workbook.created).toBeInstanceOf(Date);
    });

    it("should freeze header row on all sheets", async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      workbook.worksheets.forEach((sheet) => {
        expect(sheet.views?.[0]?.state).toBe("frozen");
        expect((sheet.views?.[0] as any)?.ySplit).toBe(1);
      });
    });
  });

  // ==========================================================================
  // PARTS SHEET TESTS - Phase 3A with Brand Columns
  // ==========================================================================

  describe("Parts Sheet (Phase 3A with Brand Columns)", () => {
    it("should create parts sheet with base columns", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: "Front",
          abs_type: "Yes",
          bolt_pattern: "5x114.3",
          drive_type: "FWD",
          specifications: "Test specs",
          has_360_viewer: false,
        },
      ];

      // Mock parts fetch
      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      // Mock vehicles fetch (empty)
      mockRange.mockReturnValueOnce({ data: [], error: null });
      // Mock cross-refs by part fetch (empty)
      mockRange.mockReturnValueOnce({ data: [], error: null });
      // Mock images by part fetch (empty)
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      expect(partsSheet).toBeDefined();

      const headerRow = partsSheet?.getRow(1);
      const headers = headerRow?.values as any[];

      // Base columns
      expect(headers).toContain("_id");
      expect(headers).toContain("ACR_SKU");
      expect(headers).toContain("Part_Type");
      expect(headers).toContain("Position_Type");
      expect(headers).toContain("ABS_Type");
      expect(headers).toContain("Bolt_Pattern");
      expect(headers).toContain("Drive_Type");
      expect(headers).toContain("Specifications");
    });

    it("should include 11 brand columns for cross-references", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(1);
      const headers = headerRow?.values as any[];

      // Phase 3A brand columns
      expect(headers).toContain("National_SKUs");
      expect(headers).toContain("ATV_SKUs");
      expect(headers).toContain("SYD_SKUs");
      expect(headers).toContain("TMK_SKUs");
      expect(headers).toContain("GROB_SKUs");
      expect(headers).toContain("RACE_SKUs");
      expect(headers).toContain("OEM_SKUs");
      expect(headers).toContain("OEM_2_SKUs");
      expect(headers).toContain("GMB_SKUs");
      expect(headers).toContain("GSP_SKUs");
      expect(headers).toContain("FAG_SKUs");
    });

    it("should include image URL columns", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(1);
      const headers = headerRow?.values as any[];

      // Phase 3B image columns
      expect(headers).toContain("Image_URL_Front");
      expect(headers).toContain("Image_URL_Back");
      expect(headers).toContain("Image_URL_Top");
      expect(headers).toContain("Image_URL_Other");
      expect(headers).toContain("360_Viewer_Status");
    });

    it("should hide _id column in parts sheet", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const idColumn = partsSheet?.getColumn(1); // _id is first column

      expect(idColumn?.hidden).toBe(true);
    });

    it("should map database fields to Excel columns correctly", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: "Front",
          abs_type: "Yes",
          bolt_pattern: "5x114.3",
          drive_type: "FWD",
          specifications: "Test specs",
          has_360_viewer: false,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const dataRow = partsSheet?.getRow(2); // Row 2 is first data row

      // Get cell values by column index (base columns)
      // Note: Column order includes _action at position 2
      expect(dataRow?.getCell(1).value).toBe("part-uuid-1"); // _id
      // Column 2 is _action (empty for non-delete operations)
      expect(dataRow?.getCell(3).value).toBe("ACR-001"); // ACR_SKU
      expect(dataRow?.getCell(4).value).toBe("Rotor"); // Part_Type
      expect(dataRow?.getCell(5).value).toBe("Front"); // Position_Type
      expect(dataRow?.getCell(6).value).toBe("Yes"); // ABS_Type
      expect(dataRow?.getCell(7).value).toBe("5x114.3"); // Bolt_Pattern
      expect(dataRow?.getCell(8).value).toBe("FWD"); // Drive_Type
      expect(dataRow?.getCell(9).value).toBe("Test specs"); // Specifications
    });

    it("should convert null values to empty strings", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const dataRow = partsSheet?.getRow(2);

      // Null fields should be empty strings
      // Note: Column order includes _action at position 2
      expect(dataRow?.getCell(5).value).toBe(""); // Position_Type (column 5)
      expect(dataRow?.getCell(6).value).toBe(""); // ABS_Type (column 6)
      expect(dataRow?.getCell(7).value).toBe(""); // Bolt_Pattern (column 7)
      expect(dataRow?.getCell(8).value).toBe(""); // Drive_Type (column 8)
      expect(dataRow?.getCell(9).value).toBe(""); // Specifications (column 9)
    });

    it("should handle multiple parts correctly", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: "Front",
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
        {
          id: "part-uuid-2",
          acr_sku: "ACR-002",
          part_type: "Caliper",
          position_type: "Rear",
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
        {
          id: "part-uuid-3",
          acr_sku: "ACR-003",
          part_type: "Pad",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");

      // Should have header + 3 data rows
      expect(partsSheet?.rowCount).toBe(4);

      // Verify data (ACR_SKU is column 3, after _id and _action)
      expect(partsSheet?.getRow(2).getCell(3).value).toBe("ACR-001");
      expect(partsSheet?.getRow(3).getCell(3).value).toBe("ACR-002");
      expect(partsSheet?.getRow(4).getCell(3).value).toBe("ACR-003");
    });
  });

  // ==========================================================================
  // BRAND COLUMNS EXPORT TESTS
  // ==========================================================================

  describe("Brand Columns Export (Cross-Refs Inline)", () => {
    it("should populate brand columns with semicolon-separated SKUs", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      const mockCrossRefs = [
        {
          acr_part_id: "part-uuid-1",
          competitor_brand: "NATIONAL",
          competitor_sku: "NAT-100",
        },
        {
          acr_part_id: "part-uuid-1",
          competitor_brand: "NATIONAL",
          competitor_sku: "NAT-200",
        },
        {
          acr_part_id: "part-uuid-1",
          competitor_brand: "ATV",
          competitor_sku: "ATV-999",
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null }); // vehicles
      mockRange.mockReturnValueOnce({ data: mockCrossRefs, error: null }); // cross-refs
      mockRange.mockReturnValueOnce({ data: [], error: null }); // images

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(1);
      const headers = (headerRow?.values as any[]) || [];
      const dataRow = partsSheet?.getRow(2);

      // Find column indices for brand columns
      const nationalIdx = headers.indexOf("National_SKUs");
      const atvIdx = headers.indexOf("ATV_SKUs");

      expect(nationalIdx).toBeGreaterThan(0);
      expect(atvIdx).toBeGreaterThan(0);

      // Verify semicolon-separated values
      expect(dataRow?.getCell(nationalIdx).value).toBe("NAT-100;NAT-200");
      expect(dataRow?.getCell(atvIdx).value).toBe("ATV-999");
    });

    it("should leave brand columns empty when no cross-refs for that brand", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null }); // No cross-refs
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(1);
      const headers = (headerRow?.values as any[]) || [];
      const dataRow = partsSheet?.getRow(2);

      // All brand columns should be empty
      const nationalIdx = headers.indexOf("National_SKUs");
      const atvIdx = headers.indexOf("ATV_SKUs");

      expect(dataRow?.getCell(nationalIdx).value).toBe("");
      expect(dataRow?.getCell(atvIdx).value).toBe("");
    });
  });

  // ==========================================================================
  // IMAGE URL COLUMNS EXPORT TESTS
  // ==========================================================================

  describe("Image URL Columns Export", () => {
    it("should populate image URL columns by view_type", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: true,
        },
      ];

      const mockImages = [
        {
          part_id: "part-uuid-1",
          view_type: "front",
          image_url: "https://example.com/front.jpg",
        },
        {
          part_id: "part-uuid-1",
          view_type: "back",
          image_url: "https://example.com/back.jpg",
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockImages, error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(1);
      const headers = (headerRow?.values as any[]) || [];
      const dataRow = partsSheet?.getRow(2);

      const frontIdx = headers.indexOf("Image_URL_Front");
      const backIdx = headers.indexOf("Image_URL_Back");
      const statusIdx = headers.indexOf("360_Viewer_Status");

      expect(dataRow?.getCell(frontIdx).value).toBe(
        "https://example.com/front.jpg"
      );
      expect(dataRow?.getCell(backIdx).value).toBe(
        "https://example.com/back.jpg"
      );
      expect(dataRow?.getCell(statusIdx).value).toBe("Confirmed");
    });

    it("should show empty 360_Viewer_Status when has_360_viewer is false", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(1);
      const headers = (headerRow?.values as any[]) || [];
      const dataRow = partsSheet?.getRow(2);

      const statusIdx = headers.indexOf("360_Viewer_Status");
      expect(dataRow?.getCell(statusIdx).value).toBe("");
    });
  });

  // ==========================================================================
  // VEHICLE APPLICATIONS SHEET TESTS
  // ==========================================================================

  describe("Vehicle Applications Sheet", () => {
    it("should create vehicles sheet with correct columns", async () => {
      const mockVehicles = [
        {
          id: "vehicle-uuid-1",
          part_id: "part-uuid-1",
          make: "Toyota",
          model: "Camry",
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: "ACR-001" },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null }); // Parts
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null }); // Vehicles
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Cross-refs
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Images

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet("Vehicle Applications");
      const headerRow = vehiclesSheet?.getRow(1);
      const headers = headerRow?.values as any[];

      // Expected columns: _id, _part_id, ACR_SKU, Make, Model, Start_Year, End_Year
      expect(headers).toContain("_id");
      expect(headers).toContain("_part_id");
      expect(headers).toContain("ACR_SKU");
      expect(headers).toContain("Make");
      expect(headers).toContain("Model");
      expect(headers).toContain("Start_Year");
      expect(headers).toContain("End_Year");
    });

    it("should hide _id and _part_id columns in vehicles sheet", async () => {
      const mockVehicles = [
        {
          id: "vehicle-uuid-1",
          part_id: "part-uuid-1",
          make: "Toyota",
          model: "Camry",
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: "ACR-001" },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet("Vehicle Applications");

      expect(vehiclesSheet?.getColumn(1).hidden).toBe(true); // _id
      expect(vehiclesSheet?.getColumn(2).hidden).toBe(true); // _part_id
    });

    it("should include ACR_SKU from joined parts table", async () => {
      const mockVehicles = [
        {
          id: "vehicle-uuid-1",
          part_id: "part-uuid-1",
          make: "Toyota",
          model: "Camry",
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: "ACR-001" },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet("Vehicle Applications");
      const dataRow = vehiclesSheet?.getRow(2);

      expect(dataRow?.getCell(3).value).toBe("ACR-001"); // ACR_SKU column
    });

    it("should map vehicle fields correctly", async () => {
      const mockVehicles = [
        {
          id: "vehicle-uuid-1",
          part_id: "part-uuid-1",
          make: "Honda",
          model: "Accord",
          start_year: 2018,
          end_year: 2022,
          parts: { acr_sku: "ACR-002" },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet("Vehicle Applications");
      const dataRow = vehiclesSheet?.getRow(2);

      expect(dataRow?.getCell(1).value).toBe("vehicle-uuid-1"); // _id
      expect(dataRow?.getCell(2).value).toBe("part-uuid-1"); // _part_id
      expect(dataRow?.getCell(3).value).toBe("ACR-002"); // ACR_SKU
      expect(dataRow?.getCell(4).value).toBe("Honda"); // Make
      expect(dataRow?.getCell(5).value).toBe("Accord"); // Model
      expect(dataRow?.getCell(6).value).toBe(2018); // Start_Year
      expect(dataRow?.getCell(7).value).toBe(2022); // End_Year
    });
  });

  // ==========================================================================
  // EMPTY DATA TESTS
  // ==========================================================================

  describe("Empty Data Handling (Phase 3A)", () => {
    it("should create valid workbook with empty database (2 sheets)", async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(2);

      // Each sheet should have only header row
      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(1);
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(1);
    });

    it("should handle parts without vehicles (2-sheet format)", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null }); // Parts
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Vehicles
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Cross-refs
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Images

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(2); // Header + 1 part
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(1); // Header only
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe("Error Handling", () => {
    it("should throw error when parts fetch fails", async () => {
      mockRange.mockReturnValueOnce({
        data: null,
        error: { message: "Database connection failed" },
      });

      await expect(exportService.exportAllData()).rejects.toThrow(
        "Failed to fetch parts"
      );
    });

    it("should throw error when vehicles fetch fails", async () => {
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Parts succeed
      mockRange.mockReturnValueOnce({
        data: null,
        error: { message: "Query timeout" },
      }); // Vehicles fail

      await expect(exportService.exportAllData()).rejects.toThrow(
        "Failed to fetch vehicle applications"
      );
    });
  });

  // ==========================================================================
  // FILTERED EXPORT TESTS
  // ==========================================================================

  describe("Filtered Export (Phase 3A)", () => {
    it("should return empty 2-sheet workbook when no parts match filter", async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportFiltered({
        search: "NONEXISTENT",
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(2);
      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(1); // Header only
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(1);
    });

    it("should export only filtered parts and their relationships", async () => {
      const mockFilteredParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      const mockRelatedVehicles = [
        {
          id: "vehicle-uuid-1",
          part_id: "part-uuid-1",
          make: "Toyota",
          model: "Camry",
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: "ACR-001" },
        },
      ];

      // Mock filtered parts query
      mockRange.mockReturnValueOnce({ data: mockFilteredParts, error: null });
      // Mock vehicles query (with .in() filter)
      mockRange.mockReturnValueOnce({ data: mockRelatedVehicles, error: null });
      // Mock cross-refs query
      mockRange.mockReturnValueOnce({ data: [], error: null });
      // Mock images query
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportFiltered({ part_type: "Rotor" });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(2);
      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(2); // Header + 1 part
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(2); // Header + 1 vehicle
    });
  });

  // ==========================================================================
  // FULL EXPORT INTEGRATION
  // ==========================================================================

  describe("Full Export Integration (Phase 3A)", () => {
    it("should export complete database with 2-sheet format", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          part_type: "Rotor",
          position_type: "Front",
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: "Premium",
          has_360_viewer: true,
        },
        {
          id: "part-uuid-2",
          acr_sku: "ACR-002",
          part_type: "Caliper",
          position_type: "Rear",
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
          has_360_viewer: false,
        },
      ];

      const mockVehicles = [
        {
          id: "vehicle-uuid-1",
          part_id: "part-uuid-1",
          make: "Toyota",
          model: "Camry",
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: "ACR-001" },
        },
        {
          id: "vehicle-uuid-2",
          part_id: "part-uuid-2",
          make: "Honda",
          model: "Accord",
          start_year: 2018,
          end_year: 2022,
          parts: { acr_sku: "ACR-002" },
        },
      ];

      const mockCrossRefs = [
        {
          acr_part_id: "part-uuid-1",
          competitor_brand: "NATIONAL",
          competitor_sku: "NAT-001",
        },
      ];

      const mockImages = [
        {
          part_id: "part-uuid-1",
          view_type: "front",
          image_url: "https://example.com/front.jpg",
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null });
      mockRange.mockReturnValueOnce({ data: mockCrossRefs, error: null });
      mockRange.mockReturnValueOnce({ data: mockImages, error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      // Verify 2-sheet structure
      expect(workbook.worksheets.length).toBe(2);

      // Verify all data is present
      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(3); // Header + 2 parts
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(3); // Header + 2 vehicles

      // Verify data integrity (ACR_SKU is column 3 in Parts, after _id and _action)
      const partsSheet = workbook.getWorksheet("Parts");
      expect(partsSheet?.getRow(2).getCell(3).value).toBe("ACR-001");
      expect(partsSheet?.getRow(3).getCell(3).value).toBe("ACR-002");

      const vehiclesSheet = workbook.getWorksheet("Vehicle Applications");
      expect(vehiclesSheet?.getRow(2).getCell(3).value).toBe("ACR-001"); // ACR_SKU
      expect(vehiclesSheet?.getRow(3).getCell(3).value).toBe("ACR-002");
    });
  });
});
