/**
 * ExcelExportService Unit Tests
 *
 * Tests Excel export functionality including:
 * - Workbook creation (3 sheets with correct structure)
 * - Column mapping (database → Excel format)
 * - Hidden column configuration (_id fields)
 * - Data formatting (nulls → empty strings)
 * - Empty data handling
 * - Filtered export
 *
 * Note: Supabase client is mocked. Integration tests verify actual exports.
 */

import { ExcelExportService } from '../../../src/services/export/ExcelExportService';
import ExcelJS from 'exceljs';

// Mock Supabase client
jest.mock('../../../src/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '../../../src/lib/supabase/client';

describe('ExcelExportService', () => {
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
  // WORKBOOK STRUCTURE TESTS
  // ==========================================================================

  describe('Workbook Structure', () => {
    it('should create workbook with 3 sheets in correct order', async () => {
      // Mock empty database
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      // Parse the buffer to verify structure
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(3);
      expect(workbook.worksheets[0].name).toBe('Parts');
      expect(workbook.worksheets[1].name).toBe('Vehicle Applications');
      expect(workbook.worksheets[2].name).toBe('Cross References');
    });

    it('should set workbook metadata (creator, created date)', async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.creator).toBe('ACR Automotive');
      expect(workbook.created).toBeInstanceOf(Date);
    });

    it('should freeze header row on all sheets', async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      workbook.worksheets.forEach((sheet) => {
        expect(sheet.views?.[0]?.state).toBe('frozen');
        expect((sheet.views?.[0] as any)?.ySplit).toBe(1);
      });
    });
  });

  // ==========================================================================
  // PARTS SHEET TESTS
  // ==========================================================================

  describe('Parts Sheet', () => {
    it('should create parts sheet with correct columns', async () => {
      const mockParts = [
        {
          id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          part_type: 'Rotor',
          position_type: 'Front',
          abs_type: 'Yes',
          bolt_pattern: '5x114.3',
          drive_type: 'FWD',
          specifications: 'Test specs',
        },
      ];

      // Mock parts fetch
      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      // Mock vehicles fetch (empty)
      mockRange.mockReturnValueOnce({ data: [], error: null });
      // Mock cross-refs fetch (empty)
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet('Parts');
      expect(partsSheet).toBeDefined();

      const headerRow = partsSheet?.getRow(1);
      const headers = headerRow?.values as any[];

      // Expected columns: _id, ACR_SKU, Part_Type, Position_Type, ABS_Type, Bolt_Pattern, Drive_Type, Specifications
      expect(headers).toContain('_id');
      expect(headers).toContain('ACR_SKU');
      expect(headers).toContain('Part_Type');
      expect(headers).toContain('Position_Type');
      expect(headers).toContain('ABS_Type');
      expect(headers).toContain('Bolt_Pattern');
      expect(headers).toContain('Drive_Type');
      expect(headers).toContain('Specifications');
    });

    it('should hide _id column in parts sheet', async () => {
      const mockParts = [
        {
          id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          part_type: 'Rotor',
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet('Parts');
      const idColumn = partsSheet?.getColumn(1); // _id is first column

      expect(idColumn?.hidden).toBe(true);
    });

    it('should map database fields to Excel columns correctly', async () => {
      const mockParts = [
        {
          id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          part_type: 'Rotor',
          position_type: 'Front',
          abs_type: 'Yes',
          bolt_pattern: '5x114.3',
          drive_type: 'FWD',
          specifications: 'Test specs',
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet('Parts');
      const dataRow = partsSheet?.getRow(2); // Row 2 is first data row

      // Get cell values by column index
      expect(dataRow?.getCell(1).value).toBe('part-uuid-1'); // _id
      expect(dataRow?.getCell(2).value).toBe('ACR-001'); // ACR_SKU
      expect(dataRow?.getCell(3).value).toBe('Rotor'); // Part_Type
      expect(dataRow?.getCell(4).value).toBe('Front'); // Position_Type
      expect(dataRow?.getCell(5).value).toBe('Yes'); // ABS_Type
      expect(dataRow?.getCell(6).value).toBe('5x114.3'); // Bolt_Pattern
      expect(dataRow?.getCell(7).value).toBe('FWD'); // Drive_Type
      expect(dataRow?.getCell(8).value).toBe('Test specs'); // Specifications
    });

    it('should convert null values to empty strings', async () => {
      const mockParts = [
        {
          id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          part_type: 'Rotor',
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet('Parts');
      const dataRow = partsSheet?.getRow(2);

      // Null fields should be empty strings
      expect(dataRow?.getCell(4).value).toBe(''); // Position_Type
      expect(dataRow?.getCell(5).value).toBe(''); // ABS_Type
      expect(dataRow?.getCell(6).value).toBe(''); // Bolt_Pattern
      expect(dataRow?.getCell(7).value).toBe(''); // Drive_Type
      expect(dataRow?.getCell(8).value).toBe(''); // Specifications
    });

    it('should handle multiple parts correctly', async () => {
      const mockParts = [
        {
          id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          part_type: 'Rotor',
          position_type: 'Front',
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
        },
        {
          id: 'part-uuid-2',
          acr_sku: 'ACR-002',
          part_type: 'Caliper',
          position_type: 'Rear',
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
        },
        {
          id: 'part-uuid-3',
          acr_sku: 'ACR-003',
          part_type: 'Pad',
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const partsSheet = workbook.getWorksheet('Parts');

      // Should have header + 3 data rows
      expect(partsSheet?.rowCount).toBe(4);

      // Verify data
      expect(partsSheet?.getRow(2).getCell(2).value).toBe('ACR-001');
      expect(partsSheet?.getRow(3).getCell(2).value).toBe('ACR-002');
      expect(partsSheet?.getRow(4).getCell(2).value).toBe('ACR-003');
    });
  });

  // ==========================================================================
  // VEHICLE APPLICATIONS SHEET TESTS
  // ==========================================================================

  describe('Vehicle Applications Sheet', () => {
    it('should create vehicles sheet with correct columns', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-uuid-1',
          part_id: 'part-uuid-1',
          make: 'Toyota',
          model: 'Camry',
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: 'ACR-001' },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null }); // Parts
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null }); // Vehicles
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Cross-refs

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet('Vehicle Applications');
      const headerRow = vehiclesSheet?.getRow(1);
      const headers = headerRow?.values as any[];

      // Expected columns: _id, _part_id, ACR_SKU, Make, Model, Start_Year, End_Year
      expect(headers).toContain('_id');
      expect(headers).toContain('_part_id');
      expect(headers).toContain('ACR_SKU');
      expect(headers).toContain('Make');
      expect(headers).toContain('Model');
      expect(headers).toContain('Start_Year');
      expect(headers).toContain('End_Year');
    });

    it('should hide _id and _part_id columns in vehicles sheet', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-uuid-1',
          part_id: 'part-uuid-1',
          make: 'Toyota',
          model: 'Camry',
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: 'ACR-001' },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet('Vehicle Applications');

      expect(vehiclesSheet?.getColumn(1).hidden).toBe(true); // _id
      expect(vehiclesSheet?.getColumn(2).hidden).toBe(true); // _part_id
    });

    it('should include ACR_SKU from joined parts table', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-uuid-1',
          part_id: 'part-uuid-1',
          make: 'Toyota',
          model: 'Camry',
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: 'ACR-001' },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet('Vehicle Applications');
      const dataRow = vehiclesSheet?.getRow(2);

      expect(dataRow?.getCell(3).value).toBe('ACR-001'); // ACR_SKU column
    });

    it('should map vehicle fields correctly', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-uuid-1',
          part_id: 'part-uuid-1',
          make: 'Honda',
          model: 'Accord',
          start_year: 2018,
          end_year: 2022,
          parts: { acr_sku: 'ACR-002' },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const vehiclesSheet = workbook.getWorksheet('Vehicle Applications');
      const dataRow = vehiclesSheet?.getRow(2);

      expect(dataRow?.getCell(1).value).toBe('vehicle-uuid-1'); // _id
      expect(dataRow?.getCell(2).value).toBe('part-uuid-1'); // _part_id
      expect(dataRow?.getCell(3).value).toBe('ACR-002'); // ACR_SKU
      expect(dataRow?.getCell(4).value).toBe('Honda'); // Make
      expect(dataRow?.getCell(5).value).toBe('Accord'); // Model
      expect(dataRow?.getCell(6).value).toBe(2018); // Start_Year
      expect(dataRow?.getCell(7).value).toBe(2022); // End_Year
    });
  });

  // ==========================================================================
  // CROSS REFERENCES SHEET TESTS
  // ==========================================================================

  describe('Cross References Sheet', () => {
    it('should create cross-references sheet with correct columns', async () => {
      const mockCrossRefs = [
        {
          id: 'crossref-uuid-1',
          acr_part_id: 'part-uuid-1',
          competitor_brand: 'Bosch',
          competitor_sku: 'BOSCH-123',
          parts: { acr_sku: 'ACR-001' },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null }); // Parts
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Vehicles
      mockRange.mockReturnValueOnce({ data: mockCrossRefs, error: null }); // Cross-refs

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const crossRefsSheet = workbook.getWorksheet('Cross References');
      const headerRow = crossRefsSheet?.getRow(1);
      const headers = headerRow?.values as any[];

      // Expected columns: _id, _acr_part_id, ACR_SKU, Competitor_Brand, Competitor_SKU
      expect(headers).toContain('_id');
      expect(headers).toContain('_acr_part_id');
      expect(headers).toContain('ACR_SKU');
      expect(headers).toContain('Competitor_Brand');
      expect(headers).toContain('Competitor_SKU');
    });

    it('should hide _id and _acr_part_id columns', async () => {
      const mockCrossRefs = [
        {
          id: 'crossref-uuid-1',
          acr_part_id: 'part-uuid-1',
          competitor_brand: 'Bosch',
          competitor_sku: 'BOSCH-123',
          parts: { acr_sku: 'ACR-001' },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockCrossRefs, error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const crossRefsSheet = workbook.getWorksheet('Cross References');

      expect(crossRefsSheet?.getColumn(1).hidden).toBe(true); // _id
      expect(crossRefsSheet?.getColumn(2).hidden).toBe(true); // _acr_part_id
    });

    it('should map cross-reference fields correctly', async () => {
      const mockCrossRefs = [
        {
          id: 'crossref-uuid-1',
          acr_part_id: 'part-uuid-1',
          competitor_brand: 'Brembo',
          competitor_sku: 'BREMBO-456',
          parts: { acr_sku: 'ACR-003' },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockCrossRefs, error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const crossRefsSheet = workbook.getWorksheet('Cross References');
      const dataRow = crossRefsSheet?.getRow(2);

      expect(dataRow?.getCell(1).value).toBe('crossref-uuid-1'); // _id
      expect(dataRow?.getCell(2).value).toBe('part-uuid-1'); // _acr_part_id
      expect(dataRow?.getCell(3).value).toBe('ACR-003'); // ACR_SKU
      expect(dataRow?.getCell(4).value).toBe('Brembo'); // Competitor_Brand
      expect(dataRow?.getCell(5).value).toBe('BREMBO-456'); // Competitor_SKU
    });

    it('should handle empty competitor_brand as empty string', async () => {
      const mockCrossRefs = [
        {
          id: 'crossref-uuid-1',
          acr_part_id: 'part-uuid-1',
          competitor_brand: null,
          competitor_sku: 'GENERIC-123',
          parts: { acr_sku: 'ACR-001' },
        },
      ];

      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: [], error: null });
      mockRange.mockReturnValueOnce({ data: mockCrossRefs, error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      const crossRefsSheet = workbook.getWorksheet('Cross References');
      const dataRow = crossRefsSheet?.getRow(2);

      expect(dataRow?.getCell(4).value).toBe(''); // Competitor_Brand (null → '')
    });
  });

  // ==========================================================================
  // EMPTY DATA TESTS
  // ==========================================================================

  describe('Empty Data Handling', () => {
    it('should create valid workbook with empty database', async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(3);

      // Each sheet should have only header row
      expect(workbook.getWorksheet('Parts')?.rowCount).toBe(1);
      expect(workbook.getWorksheet('Vehicle Applications')?.rowCount).toBe(1);
      expect(workbook.getWorksheet('Cross References')?.rowCount).toBe(1);
    });

    it('should handle parts without vehicles or cross-refs', async () => {
      const mockParts = [
        {
          id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          part_type: 'Rotor',
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null }); // Parts
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Vehicles
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Cross-refs

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.getWorksheet('Parts')?.rowCount).toBe(2); // Header + 1 part
      expect(workbook.getWorksheet('Vehicle Applications')?.rowCount).toBe(1); // Header only
      expect(workbook.getWorksheet('Cross References')?.rowCount).toBe(1); // Header only
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {
    it('should throw error when parts fetch fails', async () => {
      mockRange.mockReturnValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(exportService.exportAllData()).rejects.toThrow(
        'Failed to fetch parts'
      );
    });

    it('should throw error when vehicles fetch fails', async () => {
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Parts succeed
      mockRange.mockReturnValueOnce({
        data: null,
        error: { message: 'Query timeout' },
      }); // Vehicles fail

      await expect(exportService.exportAllData()).rejects.toThrow(
        'Failed to fetch vehicle applications'
      );
    });

    it('should throw error when cross-refs fetch fails', async () => {
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Parts succeed
      mockRange.mockReturnValueOnce({ data: [], error: null }); // Vehicles succeed
      mockRange.mockReturnValueOnce({
        data: null,
        error: { message: 'Permission denied' },
      }); // Cross-refs fail

      await expect(exportService.exportAllData()).rejects.toThrow(
        'Failed to fetch cross references'
      );
    });
  });

  // ==========================================================================
  // FILTERED EXPORT TESTS
  // ==========================================================================

  describe('Filtered Export', () => {
    it('should return empty workbook when no parts match filter', async () => {
      mockRange.mockReturnValue({ data: [], error: null });

      const buffer = await exportService.exportFiltered({ search: 'NONEXISTENT' });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.getWorksheet('Parts')?.rowCount).toBe(1); // Header only
      expect(workbook.getWorksheet('Vehicle Applications')?.rowCount).toBe(1);
      expect(workbook.getWorksheet('Cross References')?.rowCount).toBe(1);
    });

    it('should export only filtered parts and their relationships', async () => {
      const mockFilteredParts = [
        {
          id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          part_type: 'Rotor',
          position_type: null,
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
        },
      ];

      const mockRelatedVehicles = [
        {
          id: 'vehicle-uuid-1',
          part_id: 'part-uuid-1',
          make: 'Toyota',
          model: 'Camry',
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: 'ACR-001' },
        },
      ];

      // Mock filtered parts query
      mockRange.mockReturnValueOnce({ data: mockFilteredParts, error: null });
      // Mock vehicles query (with .in() filter)
      mockRange.mockReturnValueOnce({ data: mockRelatedVehicles, error: null });
      // Mock cross-refs query
      mockRange.mockReturnValueOnce({ data: [], error: null });

      const buffer = await exportService.exportFiltered({ part_type: 'Rotor' });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.getWorksheet('Parts')?.rowCount).toBe(2); // Header + 1 part
      expect(workbook.getWorksheet('Vehicle Applications')?.rowCount).toBe(2); // Header + 1 vehicle
      expect(workbook.getWorksheet('Cross References')?.rowCount).toBe(1); // Header only
    });
  });

  // ==========================================================================
  // INTEGRATION - FULL EXPORT
  // ==========================================================================

  describe('Full Export Integration', () => {
    it('should export complete database with all relationships', async () => {
      const mockParts = [
        {
          id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          part_type: 'Rotor',
          position_type: 'Front',
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: 'Premium',
        },
        {
          id: 'part-uuid-2',
          acr_sku: 'ACR-002',
          part_type: 'Caliper',
          position_type: 'Rear',
          abs_type: null,
          bolt_pattern: null,
          drive_type: null,
          specifications: null,
        },
      ];

      const mockVehicles = [
        {
          id: 'vehicle-uuid-1',
          part_id: 'part-uuid-1',
          make: 'Toyota',
          model: 'Camry',
          start_year: 2020,
          end_year: 2024,
          parts: { acr_sku: 'ACR-001' },
        },
        {
          id: 'vehicle-uuid-2',
          part_id: 'part-uuid-2',
          make: 'Honda',
          model: 'Accord',
          start_year: 2018,
          end_year: 2022,
          parts: { acr_sku: 'ACR-002' },
        },
      ];

      const mockCrossRefs = [
        {
          id: 'crossref-uuid-1',
          acr_part_id: 'part-uuid-1',
          competitor_brand: 'Bosch',
          competitor_sku: 'BOSCH-123',
          parts: { acr_sku: 'ACR-001' },
        },
      ];

      mockRange.mockReturnValueOnce({ data: mockParts, error: null });
      mockRange.mockReturnValueOnce({ data: mockVehicles, error: null });
      mockRange.mockReturnValueOnce({ data: mockCrossRefs, error: null });

      const buffer = await exportService.exportAllData();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      // Verify all data is present
      expect(workbook.getWorksheet('Parts')?.rowCount).toBe(3); // Header + 2 parts
      expect(workbook.getWorksheet('Vehicle Applications')?.rowCount).toBe(3); // Header + 2 vehicles
      expect(workbook.getWorksheet('Cross References')?.rowCount).toBe(2); // Header + 1 crossref

      // Verify data integrity
      const partsSheet = workbook.getWorksheet('Parts');
      expect(partsSheet?.getRow(2).getCell(2).value).toBe('ACR-001');
      expect(partsSheet?.getRow(3).getCell(2).value).toBe('ACR-002');

      const vehiclesSheet = workbook.getWorksheet('Vehicle Applications');
      expect(vehiclesSheet?.getRow(2).getCell(3).value).toBe('ACR-001'); // ACR_SKU
      expect(vehiclesSheet?.getRow(3).getCell(3).value).toBe('ACR-002');

      const crossRefsSheet = workbook.getWorksheet('Cross References');
      expect(crossRefsSheet?.getRow(2).getCell(3).value).toBe('ACR-001'); // ACR_SKU
    });
  });
});
