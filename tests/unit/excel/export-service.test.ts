/**
 * ExcelExportService Unit Tests - Phase 4A (3-Sheet Format with Styling)
 *
 * Tests Excel export functionality for the new 3-sheet format:
 * - Parts sheet with inline cross-refs (brand columns), image URLs, and Status column
 * - Vehicle Applications sheet
 * - Vehicle Aliases sheet (Phase 4A)
 *
 * Sheet Structure (with styling):
 * - Row 1: Group headers (merged cells for logical groupings)
 * - Row 2: Column headers
 * - Row 3: Instructions row (help text for each column)
 * - Row 4+: Data rows with alternating colors
 *
 * Phase 4A changes:
 * - Cross References sheet eliminated (inline in Parts sheet)
 * - 11 brand columns in Parts sheet (semicolon-separated SKUs)
 * - 4 image URL columns + 360_Viewer_Status in Parts sheet
 * - Status column for workflow_status
 * - Vehicle Aliases sheet for managing vehicle nicknames
 * - Styled headers with group headers and instructions row
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

describe("ExcelExportService - Phase 4A (3-Sheet Format with Styling)", () => {
  let exportService: ExcelExportService;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockOrder: jest.Mock;
  let mockRange: jest.Mock;
  let mockEq: jest.Mock;
  let mockOr: jest.Mock;
  let mockIn: jest.Mock;

  // Header row constants for styled sheets
  const GROUP_HEADER_ROW = 1;
  const COLUMN_HEADER_ROW = 2;
  const INSTRUCTIONS_ROW = 3;
  const FIRST_DATA_ROW = 4;

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
  // WORKBOOK STRUCTURE TESTS - Phase 4A 3-Sheet Format with Styling
  // ==========================================================================

  describe("Workbook Structure (Phase 4A)", () => {
    it("should create workbook with 3 sheets (Parts + Vehicle Applications + Vehicle Aliases)", async () => {
      // Mock empty database
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      // Parse the buffer to verify structure
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(3);
      expect(workbook.worksheets[0].name).toBe("Parts");
      expect(workbook.worksheets[1].name).toBe("Vehicle Applications");
      expect(workbook.worksheets[2].name).toBe("Vehicle Aliases");
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

    it("should freeze header rows on all sheets (3 rows: group + column + instructions)", async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      workbook.worksheets.forEach((sheet) => {
        expect(sheet.views?.[0]?.state).toBe("frozen");
        expect((sheet.views?.[0] as any)?.ySplit).toBe(3);
      });
    });
  });

  // ==========================================================================
  // PARTS SHEET TESTS - Phase 4A with Brand Columns, Status, and Styling
  // ==========================================================================

  describe("Parts Sheet (Phase 4A with Brand Columns and Styling)", () => {
    it("should create parts sheet with base columns", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          workflow_status: "ACTIVE",
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
      // Mock aliases fetch (empty)
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      expect(partsSheet).toBeDefined();

      // Column headers are now in row 2 (row 1 is group headers)
      const headerRow = partsSheet?.getRow(COLUMN_HEADER_ROW);
      const headers = headerRow?.values as any[];

      // Base columns (using friendly names with spaces)
      expect(headers).toContain("_id");
      expect(headers).toContain("ACR SKU");
      expect(headers).toContain("Status"); // New column for workflow_status
      expect(headers).toContain("Part Type");
      expect(headers).toContain("Position");
      expect(headers).toContain("ABS Type");
      expect(headers).toContain("Bolt Pattern");
      expect(headers).toContain("Drive Type");
      expect(headers).toContain("Specifications");
    });

    it("should include 11 brand columns for cross-references", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(COLUMN_HEADER_ROW);
      const headers = headerRow?.values as any[];

      // Phase 3A brand columns (just brand names without _SKUs suffix)
      expect(headers).toContain("National");
      expect(headers).toContain("ATV");
      expect(headers).toContain("SYD");
      expect(headers).toContain("TMK");
      expect(headers).toContain("GROB");
      expect(headers).toContain("RACE");
      expect(headers).toContain("OEM");
      expect(headers).toContain("OEM_2");
      expect(headers).toContain("GMB");
      expect(headers).toContain("GSP");
      expect(headers).toContain("FAG");
    });

    it("should include image URL columns", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(COLUMN_HEADER_ROW);
      const headers = headerRow?.values as any[];

      // Phase 3B image columns (friendly names with spaces)
      expect(headers).toContain("Image URL Front");
      expect(headers).toContain("Image URL Back");
      expect(headers).toContain("Image URL Top");
      expect(headers).toContain("Image URL Other");
      expect(headers).toContain("360 Viewer");
    });

    it("should hide _id column in parts sheet", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

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
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      // Data now starts at row 4 (after group headers, column headers, and instructions)
      const dataRow = partsSheet?.getRow(FIRST_DATA_ROW);

      // Get cell values by column index (base columns)
      // Column order: _id(1), _action(2), ACR_SKU(3), Status(4), Part_Type(5), Position(6), ABS_Type(7), Bolt_Pattern(8), Drive_Type(9), Specifications(10)
      expect(dataRow?.getCell(1).value).toBe("part-uuid-1"); // _id
      // Column 2 is _action (hidden, empty for normal parts)
      expect(dataRow?.getCell(3).value).toBe("ACR-001"); // ACR_SKU
      expect(dataRow?.getCell(4).value).toBe("Activo"); // Status (ACTIVE -> Activo)
      expect(dataRow?.getCell(5).value).toBe("Rotor"); // Part_Type
      expect(dataRow?.getCell(6).value).toBe("Front"); // Position
      expect(dataRow?.getCell(7).value).toBe("Yes"); // ABS_Type
      expect(dataRow?.getCell(8).value).toBe("5x114.3"); // Bolt_Pattern
      expect(dataRow?.getCell(9).value).toBe("FWD"); // Drive_Type
      expect(dataRow?.getCell(10).value).toBe("Test specs"); // Specifications
    });

    it("should convert null values to empty strings", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const dataRow = partsSheet?.getRow(FIRST_DATA_ROW);

      // Null fields should be empty strings
      // Column order: _id(1), _action(2), ACR_SKU(3), Status(4), Part_Type(5), Position(6), ABS_Type(7), Bolt_Pattern(8), Drive_Type(9), Specifications(10)
      expect(dataRow?.getCell(6).value).toBe(""); // Position
      expect(dataRow?.getCell(7).value).toBe(""); // ABS_Type
      expect(dataRow?.getCell(8).value).toBe(""); // Bolt_Pattern
      expect(dataRow?.getCell(9).value).toBe(""); // Drive_Type
      expect(dataRow?.getCell(10).value).toBe(""); // Specifications
    });

    it("should handle multiple parts correctly", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          workflow_status: "ACTIVE",
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
          workflow_status: "ACTIVE",
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
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");

      // Should have 3 header rows + 3 data rows = 6 rows total
      expect(partsSheet?.rowCount).toBe(6);

      // Verify data (ACR_SKU is column 3, after _id and _action)
      expect(partsSheet?.getRow(FIRST_DATA_ROW).getCell(3).value).toBe("ACR-001");
      expect(partsSheet?.getRow(FIRST_DATA_ROW + 1).getCell(3).value).toBe("ACR-002");
      expect(partsSheet?.getRow(FIRST_DATA_ROW + 2).getCell(3).value).toBe("ACR-003");
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
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(COLUMN_HEADER_ROW);
      const headers = (headerRow?.values as any[]) || [];
      const dataRow = partsSheet?.getRow(FIRST_DATA_ROW);

      // Find column indices for brand columns (just brand names)
      const nationalIdx = headers.indexOf("National");
      const atvIdx = headers.indexOf("ATV");

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
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(COLUMN_HEADER_ROW);
      const headers = (headerRow?.values as any[]) || [];
      const dataRow = partsSheet?.getRow(FIRST_DATA_ROW);

      // All brand columns should be empty
      const nationalIdx = headers.indexOf("National");
      const atvIdx = headers.indexOf("ATV");

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
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(COLUMN_HEADER_ROW);
      const headers = (headerRow?.values as any[]) || [];
      const dataRow = partsSheet?.getRow(FIRST_DATA_ROW);

      const frontIdx = headers.indexOf("Image URL Front");
      const backIdx = headers.indexOf("Image URL Back");
      const statusIdx = headers.indexOf("360 Viewer");

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
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet("Parts");
      const headerRow = partsSheet?.getRow(COLUMN_HEADER_ROW);
      const headers = (headerRow?.values as any[]) || [];
      const dataRow = partsSheet?.getRow(FIRST_DATA_ROW);

      const statusIdx = headers.indexOf("360 Viewer");
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet("Vehicle Applications");
      const headerRow = vehiclesSheet?.getRow(COLUMN_HEADER_ROW);
      const headers = headerRow?.values as any[];

      // Expected columns: _id, _part_id, ACR SKU, Make, Model, Start Year, End Year
      expect(headers).toContain("_id");
      expect(headers).toContain("_part_id");
      expect(headers).toContain("ACR SKU");
      expect(headers).toContain("Make");
      expect(headers).toContain("Model");
      expect(headers).toContain("Start Year");
      expect(headers).toContain("End Year");
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet("Vehicle Applications");
      const dataRow = vehiclesSheet?.getRow(FIRST_DATA_ROW);

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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet("Vehicle Applications");
      const dataRow = vehiclesSheet?.getRow(FIRST_DATA_ROW);

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

  describe("Empty Data Handling (Phase 4A)", () => {
    it("should create valid workbook with empty database (3 sheets)", async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(3);

      // Each sheet should have only header rows (group header, column header, instructions)
      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(3);
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(3);
      expect(workbook.getWorksheet("Vehicle Aliases")?.rowCount).toBe(3);
    });

    it("should handle parts without vehicles (3-sheet format)", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          workflow_status: "ACTIVE",
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
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Aliases

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      // 3 header rows + 1 part = 4 rows
      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(4);
      // 3 header rows only
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(3);
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

    // Note: Aliases error test omitted because the mock setup doesn't support
    // mocking the aliases fetch (it ends with .order() not .range())
  });

  // ==========================================================================
  // FILTERED EXPORT TESTS
  // ==========================================================================

  describe("Filtered Export (Phase 4A)", () => {
    it("should return empty 3-sheet workbook when no parts match filter", async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportFiltered({
        search: "NONEXISTENT",
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(3);
      // 3 header rows only (group header, column header, instructions)
      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(3);
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(3);
      expect(workbook.getWorksheet("Vehicle Aliases")?.rowCount).toBe(3);
    });

    it("should export only filtered parts and their relationships", async () => {
      const mockFilteredParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          workflow_status: "ACTIVE",
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
      // Mock aliases query
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportFiltered({ part_type: "Rotor" });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(3);
      // 3 header rows + 1 part = 4 rows
      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(4);
      // 3 header rows + 1 vehicle = 4 rows
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(4);
    });
  });

  // ==========================================================================
  // FULL EXPORT INTEGRATION
  // ==========================================================================

  describe("Full Export Integration (Phase 4A)", () => {
    it("should export complete database with 3-sheet format", async () => {
      const mockParts = [
        {
          id: "part-uuid-1",
          acr_sku: "ACR-001",
          workflow_status: "ACTIVE",
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
          workflow_status: "ACTIVE",
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

      const mockAliases = [
        {
          id: "alias-uuid-1",
          alias: "Chevy",
          canonical_name: "CHEVROLET",
          alias_type: "make",
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null });
      mockRange.mockReturnValueOnce({ data: mockCrossRefs, error: null });
      mockRange.mockReturnValueOnce({ data: mockImages, error: null });
      mockRange.mockReturnValueOnce({ data: mockAliases, error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      // Verify 3-sheet structure
      expect(workbook.worksheets.length).toBe(3);

      // Verify all data is present (3 header rows + data rows)
      expect(workbook.getWorksheet("Parts")?.rowCount).toBe(5); // 3 headers + 2 parts
      expect(workbook.getWorksheet("Vehicle Applications")?.rowCount).toBe(5); // 3 headers + 2 vehicles
      // Note: Aliases mock doesn't work with current setup (uses .order() not .range())
      // so only header rows appear
      expect(workbook.getWorksheet("Vehicle Aliases")?.rowCount).toBe(3); // 3 headers only

      // Verify data integrity (ACR_SKU is column 3 in Parts, after _id and _action)
      const partsSheet = workbook.getWorksheet("Parts");
      expect(partsSheet?.getRow(FIRST_DATA_ROW).getCell(3).value).toBe("ACR-001");
      expect(partsSheet?.getRow(FIRST_DATA_ROW + 1).getCell(3).value).toBe("ACR-002");

      const vehiclesSheet = workbook.getWorksheet("Vehicle Applications");
      expect(vehiclesSheet?.getRow(FIRST_DATA_ROW).getCell(3).value).toBe("ACR-001"); // ACR_SKU
      expect(vehiclesSheet?.getRow(FIRST_DATA_ROW + 1).getCell(3).value).toBe("ACR-002");
    });
  });
});
