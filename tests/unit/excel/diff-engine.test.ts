/**
 * DiffEngine Unit Tests
 *
 * Tests ID-based change detection across all three sheets:
 * - Parts
 * - Vehicle Applications
 * - Cross References
 *
 * Test Coverage:
 * - ADD operations (new rows with no _id or missing _id)
 * - UPDATE operations (existing rows with field changes)
 * - DELETE operations (database rows not in file)
 * - UNCHANGED operations (rows with no changes)
 * - Field-level change detection
 * - Optional field normalization (null/undefined/empty string)
 * - Summary calculations
 */

import { DiffEngine } from '../../../src/services/excel/diff/DiffEngine';
import { DiffOperation } from '../../../src/services/excel/diff/types';
import type {
  ParsedExcelFile,
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelCrossRefRow,
} from '../../../src/services/excel/shared/types';
import type { ExistingDatabaseData } from '../../../src/services/excel/validation/ValidationEngine';

describe('DiffEngine', () => {
  let diffEngine: DiffEngine;

  beforeEach(() => {
    diffEngine = new DiffEngine();
  });

  // ==========================================================================
  // PARTS SHEET TESTS
  // ==========================================================================

  describe('Parts Sheet - Diff Detection', () => {
    it('should detect ADD operations for new parts (no _id)', () => {
      const uploadedParts: ExcelPartRow[] = [
        {
          _id: '',
          acr_sku: 'NEW-001',
          part_type: 'Rotor',
          position_type: undefined,
          abs_type: undefined,
          bolt_pattern: undefined,
          drive_type: undefined,
          specifications: undefined,
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map(),
        crossReferences: new Map(),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: uploadedParts, rowCount: 1, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
        metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.parts.adds.length).toBe(1);
      expect(result.parts.adds[0].operation).toBe(DiffOperation.ADD);
      expect(result.parts.adds[0].after?.acr_sku).toBe('NEW-001');
      expect(result.parts.summary.totalAdds).toBe(1);
      expect(result.parts.summary.totalChanges).toBe(1);
    });

    it('should detect UPDATE operations when part fields change', () => {
      const existingPart: ExcelPartRow = {
        _id: 'part-uuid-1',
        acr_sku: 'EXISTING-001',
        part_type: 'Rotor',
        position_type: 'Front',
        abs_type: undefined,
        bolt_pattern: undefined,
        drive_type: undefined,
        specifications: 'Original specs',
      };

      const uploadedParts: ExcelPartRow[] = [
        {
          _id: 'part-uuid-1',
          acr_sku: 'EXISTING-001',
          part_type: 'Rotor',
          position_type: 'Rear', // Changed
          abs_type: undefined,
          bolt_pattern: undefined,
          drive_type: undefined,
          specifications: 'Updated specs', // Changed
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map([['part-uuid-1', existingPart]]),
        vehicleApplications: new Map(),
        crossReferences: new Map(),
        partSkus: new Set(['EXISTING-001']),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: uploadedParts, rowCount: 1, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.parts.updates.length).toBe(1);
      expect(result.parts.updates[0].operation).toBe(DiffOperation.UPDATE);
      expect(result.parts.updates[0].changes).toContain('position_type');
      expect(result.parts.updates[0].changes).toContain('specifications');
      expect(result.parts.updates[0].changes?.length).toBe(2);
      expect(result.parts.summary.totalUpdates).toBe(1);
    });

    it('should detect DELETE operations for parts in database but not in file', () => {
      const existingPart: ExcelPartRow = {
        _id: 'part-uuid-1',
        acr_sku: 'TO-DELETE-001',
        part_type: 'Rotor',
        position_type: undefined,
        abs_type: undefined,
        bolt_pattern: undefined,
        drive_type: undefined,
        specifications: undefined,
      };

      const existingData: ExistingDatabaseData = {
        parts: new Map([['part-uuid-1', existingPart]]),
        vehicleApplications: new Map(),
        crossReferences: new Map(),
        partSkus: new Set(['TO-DELETE-001']),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false }, // Empty file
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.parts.deletes.length).toBe(1);
      expect(result.parts.deletes[0].operation).toBe(DiffOperation.DELETE);
      expect(result.parts.deletes[0].before?.acr_sku).toBe('TO-DELETE-001');
      expect(result.parts.summary.totalDeletes).toBe(1);
    });

    it('should detect UNCHANGED operations when part data is identical', () => {
      const existingPart: ExcelPartRow = {
        _id: 'part-uuid-1',
        acr_sku: 'UNCHANGED-001',
        part_type: 'Rotor',
        position_type: 'Front',
        abs_type: undefined,
        bolt_pattern: undefined,
        drive_type: undefined,
        specifications: 'Same specs',
      };

      const uploadedParts: ExcelPartRow[] = [
        {
          _id: 'part-uuid-1',
          acr_sku: 'UNCHANGED-001',
          part_type: 'Rotor',
          position_type: 'Front',
          abs_type: undefined,
          bolt_pattern: undefined,
          drive_type: undefined,
          specifications: 'Same specs',
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map([['part-uuid-1', existingPart]]),
        vehicleApplications: new Map(),
        crossReferences: new Map(),
        partSkus: new Set(['UNCHANGED-001']),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: uploadedParts, rowCount: 1, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.parts.unchanged.length).toBe(1);
      expect(result.parts.unchanged[0].operation).toBe(DiffOperation.UNCHANGED);
      expect(result.parts.summary.totalUnchanged).toBe(1);
      expect(result.parts.summary.totalChanges).toBe(0); // No changes
    });

    it('should normalize optional fields (null/undefined/empty string treated as same)', () => {
      const existingPart: ExcelPartRow = {
        _id: 'part-uuid-1',
        acr_sku: 'NORM-001',
        part_type: 'Rotor',
        position_type: undefined,
        abs_type: '',
        bolt_pattern: undefined,
        drive_type: undefined,
        specifications: undefined,
      };

      const uploadedParts: ExcelPartRow[] = [
        {
          _id: 'part-uuid-1',
          acr_sku: 'NORM-001',
          part_type: 'Rotor',
          position_type: '', // null → empty string (should be UNCHANGED)
          abs_type: undefined, // empty string → null (should be UNCHANGED)
          bolt_pattern: undefined, // undefined → null (should be UNCHANGED)
          drive_type: undefined,
          specifications: '',
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map([['part-uuid-1', existingPart]]),
        vehicleApplications: new Map(),
        crossReferences: new Map(),
        partSkus: new Set(['NORM-001']),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: uploadedParts, rowCount: 1, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.parts.unchanged.length).toBe(1);
      expect(result.parts.updates.length).toBe(0); // No updates due to normalization
    });

    it('should detect ALL part field changes', () => {
      const existingPart: ExcelPartRow = {
        _id: 'part-uuid-1',
        acr_sku: 'OLD-SKU',
        part_type: 'Rotor',
        position_type: 'Front',
        abs_type: 'Yes',
        bolt_pattern: '5x114.3',
        drive_type: 'FWD',
        specifications: 'Old',
      };

      const uploadedParts: ExcelPartRow[] = [
        {
          _id: 'part-uuid-1',
          acr_sku: 'NEW-SKU', // Changed
          part_type: 'Caliper', // Changed
          position_type: 'Rear', // Changed
          abs_type: 'No', // Changed
          bolt_pattern: '5x120', // Changed
          drive_type: 'RWD', // Changed
          specifications: 'New', // Changed
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map([['part-uuid-1', existingPart]]),
        vehicleApplications: new Map(),
        crossReferences: new Map(),
        partSkus: new Set(['OLD-SKU']),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: uploadedParts, rowCount: 1, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.parts.updates.length).toBe(1);
      expect(result.parts.updates[0].changes).toEqual(
        expect.arrayContaining([
          'acr_sku',
          'part_type',
          'position_type',
          'abs_type',
          'bolt_pattern',
          'drive_type',
          'specifications',
        ])
      );
      expect(result.parts.updates[0].changes?.length).toBe(7);
    });
  });

  // ==========================================================================
  // VEHICLE APPLICATIONS SHEET TESTS
  // ==========================================================================

  describe('Vehicle Applications Sheet - Diff Detection', () => {
    it('should detect ADD operations for new vehicles', () => {
      const uploadedVehicles: ExcelVehicleAppRow[] = [
        {
          _id: '',
          _part_id: 'part-uuid-1',
          acr_sku: 'PART-001',
          make: 'Toyota',
          model: 'Camry',
          start_year: 2020,
          end_year: 2024,
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map(),
        crossReferences: new Map(),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: uploadedVehicles, rowCount: 1, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.vehicleApplications.adds.length).toBe(1);
      expect(result.vehicleApplications.adds[0].operation).toBe(DiffOperation.ADD);
      expect(result.vehicleApplications.adds[0].after?.make).toBe('Toyota');
      expect(result.vehicleApplications.summary.totalAdds).toBe(1);
    });

    it('should detect UPDATE operations when vehicle fields change', () => {
      const existingVehicle: ExcelVehicleAppRow = {
        _id: 'vehicle-uuid-1',
        _part_id: 'part-uuid-1',
        acr_sku: 'PART-001',
        make: 'Toyota',
        model: 'Camry',
        start_year: 2020,
        end_year: 2024,
      };

      const uploadedVehicles: ExcelVehicleAppRow[] = [
        {
          _id: 'vehicle-uuid-1',
          _part_id: 'part-uuid-1',
          acr_sku: 'PART-001',
          make: 'Toyota',
          model: 'Camry',
          start_year: 2019, // Changed
          end_year: 2025, // Changed
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map([['vehicle-uuid-1', existingVehicle]]),
        crossReferences: new Map(),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: uploadedVehicles, rowCount: 1, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.vehicleApplications.updates.length).toBe(1);
      expect(result.vehicleApplications.updates[0].changes).toContain('start_year');
      expect(result.vehicleApplications.updates[0].changes).toContain('end_year');
      expect(result.vehicleApplications.updates[0].changes?.length).toBe(2);
    });

    it('should detect DELETE operations for vehicles not in file', () => {
      const existingVehicle: ExcelVehicleAppRow = {
        _id: 'vehicle-uuid-1',
        _part_id: 'part-uuid-1',
        acr_sku: 'PART-001',
        make: 'Toyota',
        model: 'Camry',
        start_year: 2020,
        end_year: 2024,
      };

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map([['vehicle-uuid-1', existingVehicle]]),
        crossReferences: new Map(),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.vehicleApplications.deletes.length).toBe(1);
      expect(result.vehicleApplications.deletes[0].operation).toBe(DiffOperation.DELETE);
      expect(result.vehicleApplications.deletes[0].before?.make).toBe('Toyota');
      expect(result.vehicleApplications.summary.totalDeletes).toBe(1);
    });

    it('should detect UNCHANGED operations for identical vehicles', () => {
      const existingVehicle: ExcelVehicleAppRow = {
        _id: 'vehicle-uuid-1',
        _part_id: 'part-uuid-1',
        acr_sku: 'PART-001',
        make: 'Toyota',
        model: 'Camry',
        start_year: 2020,
        end_year: 2024,
      };

      const uploadedVehicles: ExcelVehicleAppRow[] = [
        { ...existingVehicle }, // Exact same data
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map([['vehicle-uuid-1', existingVehicle]]),
        crossReferences: new Map(),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: uploadedVehicles, rowCount: 1, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.vehicleApplications.unchanged.length).toBe(1);
      expect(result.vehicleApplications.unchanged[0].operation).toBe(DiffOperation.UNCHANGED);
      expect(result.vehicleApplications.summary.totalUnchanged).toBe(1);
      expect(result.vehicleApplications.summary.totalChanges).toBe(0);
    });

    it('should detect ALL vehicle field changes', () => {
      const existingVehicle: ExcelVehicleAppRow = {
        _id: 'vehicle-uuid-1',
        _part_id: 'part-uuid-old',
        acr_sku: 'OLD-SKU',
        make: 'Toyota',
        model: 'Camry',
        start_year: 2020,
        end_year: 2024,
      };

      const uploadedVehicles: ExcelVehicleAppRow[] = [
        {
          _id: 'vehicle-uuid-1',
          _part_id: 'part-uuid-new', // Changed
          acr_sku: 'NEW-SKU', // Changed
          make: 'Honda', // Changed
          model: 'Accord', // Changed
          start_year: 2019, // Changed
          end_year: 2025, // Changed
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map([['vehicle-uuid-1', existingVehicle]]),
        crossReferences: new Map(),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: uploadedVehicles, rowCount: 1, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.vehicleApplications.updates.length).toBe(1);
      expect(result.vehicleApplications.updates[0].changes).toEqual(
        expect.arrayContaining([
          '_part_id',
          // acr_sku is a computed field (JOIN from parts table) - intentionally excluded from change tracking
          'make',
          'model',
          'start_year',
          'end_year',
        ])
      );
      expect(result.vehicleApplications.updates[0].changes?.length).toBe(5);
    });
  });

  // ==========================================================================
  // CROSS REFERENCES SHEET TESTS
  // ==========================================================================

  describe('Cross References Sheet - Diff Detection', () => {
    it('should detect ADD operations for new cross references', () => {
      const uploadedCrossRefs: ExcelCrossRefRow[] = [
        {
          _id: '',
          _acr_part_id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          competitor_brand: 'Bosch',
          competitor_sku: 'BOSCH-123',
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map(),
        crossReferences: new Map(),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: uploadedCrossRefs, rowCount: 1, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.crossReferences.adds.length).toBe(1);
      expect(result.crossReferences.adds[0].operation).toBe(DiffOperation.ADD);
      expect(result.crossReferences.adds[0].after?.competitor_brand).toBe('Bosch');
      expect(result.crossReferences.summary.totalAdds).toBe(1);
    });

    it('should detect UPDATE operations when cross reference fields change', () => {
      const existingCrossRef: ExcelCrossRefRow = {
        _id: 'crossref-uuid-1',
        _acr_part_id: 'part-uuid-1',
        acr_sku: 'ACR-001',
        competitor_brand: 'Bosch',
        competitor_sku: 'BOSCH-123',
      };

      const uploadedCrossRefs: ExcelCrossRefRow[] = [
        {
          _id: 'crossref-uuid-1',
          _acr_part_id: 'part-uuid-1',
          acr_sku: 'ACR-001',
          competitor_brand: 'Brembo', // Changed
          competitor_sku: 'BREMBO-456', // Changed
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map(),
        crossReferences: new Map([['crossref-uuid-1', existingCrossRef]]),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: uploadedCrossRefs, rowCount: 1, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.crossReferences.updates.length).toBe(1);
      expect(result.crossReferences.updates[0].changes).toContain('competitor_brand');
      expect(result.crossReferences.updates[0].changes).toContain('competitor_sku');
      expect(result.crossReferences.updates[0].changes?.length).toBe(2);
    });

    it('should detect DELETE operations for cross references not in file', () => {
      const existingCrossRef: ExcelCrossRefRow = {
        _id: 'crossref-uuid-1',
        _acr_part_id: 'part-uuid-1',
        acr_sku: 'ACR-001',
        competitor_brand: 'Bosch',
        competitor_sku: 'BOSCH-123',
      };

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map(),
        crossReferences: new Map([['crossref-uuid-1', existingCrossRef]]),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.crossReferences.deletes.length).toBe(1);
      expect(result.crossReferences.deletes[0].operation).toBe(DiffOperation.DELETE);
      expect(result.crossReferences.deletes[0].before?.competitor_brand).toBe('Bosch');
      expect(result.crossReferences.summary.totalDeletes).toBe(1);
    });

    it('should detect UNCHANGED operations for identical cross references', () => {
      const existingCrossRef: ExcelCrossRefRow = {
        _id: 'crossref-uuid-1',
        _acr_part_id: 'part-uuid-1',
        acr_sku: 'ACR-001',
        competitor_brand: 'Bosch',
        competitor_sku: 'BOSCH-123',
      };

      const uploadedCrossRefs: ExcelCrossRefRow[] = [
        { ...existingCrossRef }, // Exact same data
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map(),
        crossReferences: new Map([['crossref-uuid-1', existingCrossRef]]),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: uploadedCrossRefs, rowCount: 1, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.crossReferences.unchanged.length).toBe(1);
      expect(result.crossReferences.unchanged[0].operation).toBe(DiffOperation.UNCHANGED);
      expect(result.crossReferences.summary.totalUnchanged).toBe(1);
      expect(result.crossReferences.summary.totalChanges).toBe(0);
    });

    it('should detect ALL cross reference field changes', () => {
      const existingCrossRef: ExcelCrossRefRow = {
        _id: 'crossref-uuid-1',
        _acr_part_id: 'part-uuid-old',
        acr_sku: 'OLD-SKU',
        competitor_brand: 'Bosch',
        competitor_sku: 'BOSCH-123',
      };

      const uploadedCrossRefs: ExcelCrossRefRow[] = [
        {
          _id: 'crossref-uuid-1',
          _acr_part_id: 'part-uuid-new', // Changed
          acr_sku: 'NEW-SKU', // Changed
          competitor_brand: 'Brembo', // Changed
          competitor_sku: 'BREMBO-456', // Changed
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map(),
        crossReferences: new Map([['crossref-uuid-1', existingCrossRef]]),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: uploadedCrossRefs, rowCount: 1, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.crossReferences.updates.length).toBe(1);
      expect(result.crossReferences.updates[0].changes).toEqual(
        expect.arrayContaining([
          '_acr_part_id',
          // acr_sku is a computed field (JOIN from parts table) - intentionally excluded from change tracking
          'competitor_brand',
          'competitor_sku',
        ])
      );
      expect(result.crossReferences.updates[0].changes?.length).toBe(3);
    });
  });

  // ==========================================================================
  // OVERALL SUMMARY TESTS
  // ==========================================================================

  describe('Overall Summary Calculation', () => {
    it('should correctly aggregate totals across all sheets', () => {
      // Setup: 1 part ADD, 1 vehicle UPDATE, 1 crossref DELETE
      const uploadedParts: ExcelPartRow[] = [
        {
          _id: '',
          acr_sku: 'NEW-001',
          part_type: 'Rotor',
          position_type: undefined,
          abs_type: undefined,
          bolt_pattern: undefined,
          drive_type: undefined,
          specifications: undefined,
        },
      ];

      const existingVehicle: ExcelVehicleAppRow = {
        _id: 'vehicle-uuid-1',
        _part_id: 'part-uuid-1',
        acr_sku: 'PART-001',
        make: 'Toyota',
        model: 'Camry',
        start_year: 2020,
        end_year: 2024,
      };

      const uploadedVehicles: ExcelVehicleAppRow[] = [
        {
          ...existingVehicle,
          start_year: 2019, // Changed
        },
      ];

      const existingCrossRef: ExcelCrossRefRow = {
        _id: 'crossref-uuid-1',
        _acr_part_id: 'part-uuid-1',
        acr_sku: 'ACR-001',
        competitor_brand: 'Bosch',
        competitor_sku: 'BOSCH-123',
      };

      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map([['vehicle-uuid-1', existingVehicle]]),
        crossReferences: new Map([['crossref-uuid-1', existingCrossRef]]),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: uploadedParts, rowCount: 1, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: uploadedVehicles, rowCount: 1, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false }, // Empty = DELETE
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      // Overall summary
      expect(result.summary.totalAdds).toBe(1); // 1 part ADD
      expect(result.summary.totalUpdates).toBe(1); // 1 vehicle UPDATE
      expect(result.summary.totalDeletes).toBe(1); // 1 crossref DELETE
      expect(result.summary.totalUnchanged).toBe(0);
      expect(result.summary.totalChanges).toBe(3); // 1 + 1 + 1

      // By-sheet breakdown
      expect(result.summary.changesBySheet.parts).toBe(1);
      expect(result.summary.changesBySheet.vehicleApplications).toBe(1);
      expect(result.summary.changesBySheet.crossReferences).toBe(1);
    });

    it('should handle empty file with zero changes', () => {
      const existingData: ExistingDatabaseData = {
        parts: new Map(),
        vehicleApplications: new Map(),
        crossReferences: new Map(),
        partSkus: new Set(),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: [], rowCount: 0, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: [], rowCount: 0, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: [], rowCount: 0, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      expect(result.summary.totalAdds).toBe(0);
      expect(result.summary.totalUpdates).toBe(0);
      expect(result.summary.totalDeletes).toBe(0);
      expect(result.summary.totalUnchanged).toBe(0);
      expect(result.summary.totalChanges).toBe(0);
    });

    it('should handle complex multi-sheet changes correctly', () => {
      // Setup complex scenario:
      // - 2 parts: 1 ADD, 1 UPDATE
      // - 3 vehicles: 1 ADD, 1 UPDATE, 1 UNCHANGED
      // - 2 crossrefs: 1 ADD, 1 DELETE

      const existingPart: ExcelPartRow = {
        _id: 'part-uuid-1',
        acr_sku: 'EXISTING-001',
        part_type: 'Rotor',
        position_type: 'Front',
        abs_type: undefined,
        bolt_pattern: undefined,
        drive_type: undefined,
        specifications: 'Old',
      };

      const uploadedParts: ExcelPartRow[] = [
        {
          _id: 'part-uuid-1',
          acr_sku: 'EXISTING-001',
          part_type: 'Rotor',
          position_type: 'Front',
          abs_type: undefined,
          bolt_pattern: undefined,
          drive_type: undefined,
          specifications: 'New', // UPDATE
        },
        {
          _id: '',
          acr_sku: 'NEW-001',
          part_type: 'Caliper',
          position_type: undefined,
          abs_type: undefined,
          bolt_pattern: undefined,
          drive_type: undefined,
          specifications: undefined, // ADD
        },
      ];

      const existingVehicle1: ExcelVehicleAppRow = {
        _id: 'vehicle-uuid-1',
        _part_id: 'part-uuid-1',
        acr_sku: 'PART-001',
        make: 'Toyota',
        model: 'Camry',
        start_year: 2020,
        end_year: 2024,
      };

      const existingVehicle2: ExcelVehicleAppRow = {
        _id: 'vehicle-uuid-2',
        _part_id: 'part-uuid-2',
        acr_sku: 'PART-002',
        make: 'Honda',
        model: 'Accord',
        start_year: 2019,
        end_year: 2023,
      };

      const uploadedVehicles: ExcelVehicleAppRow[] = [
        {
          ...existingVehicle1,
          start_year: 2019, // UPDATE
        },
        { ...existingVehicle2 }, // UNCHANGED
        {
          _id: '',
          _part_id: 'part-uuid-3',
          acr_sku: 'PART-003',
          make: 'Ford',
          model: 'Fusion',
          start_year: 2018,
          end_year: 2022, // ADD
        },
      ];

      const existingCrossRef1: ExcelCrossRefRow = {
        _id: 'crossref-uuid-1',
        _acr_part_id: 'part-uuid-1',
        acr_sku: 'ACR-001',
        competitor_brand: 'Bosch',
        competitor_sku: 'BOSCH-123',
      };

      const uploadedCrossRefs: ExcelCrossRefRow[] = [
        {
          _id: '',
          _acr_part_id: 'part-uuid-2',
          acr_sku: 'ACR-002',
          competitor_brand: 'Brembo',
          competitor_sku: 'BREMBO-456', // ADD
        },
      ];

      const existingData: ExistingDatabaseData = {
        parts: new Map([['part-uuid-1', existingPart]]),
        vehicleApplications: new Map([
          ['vehicle-uuid-1', existingVehicle1],
          ['vehicle-uuid-2', existingVehicle2],
        ]),
        crossReferences: new Map([['crossref-uuid-1', existingCrossRef1]]),
        partSkus: new Set(['EXISTING-001']),
      };

      const parsed: ParsedExcelFile = {
        parts: { sheetName: 'Parts', data: uploadedParts, rowCount: 2, hasHiddenIds: false },
        vehicleApplications: { sheetName: 'Vehicle_Applications', data: uploadedVehicles, rowCount: 3, hasHiddenIds: false },
        crossReferences: { sheetName: 'Cross_References', data: uploadedCrossRefs, rowCount: 1, hasHiddenIds: false },
      metadata: { uploadedAt: new Date(), fileName: 'test.xlsx', fileSize: 1000 },
      };

      const result = diffEngine.generateDiff(parsed, existingData);

      // Parts: 1 ADD, 1 UPDATE
      expect(result.parts.adds.length).toBe(1);
      expect(result.parts.updates.length).toBe(1);
      expect(result.parts.deletes.length).toBe(0);
      expect(result.parts.unchanged.length).toBe(0);

      // Vehicles: 1 ADD, 1 UPDATE, 1 UNCHANGED
      expect(result.vehicleApplications.adds.length).toBe(1);
      expect(result.vehicleApplications.updates.length).toBe(1);
      expect(result.vehicleApplications.deletes.length).toBe(0);
      expect(result.vehicleApplications.unchanged.length).toBe(1);

      // Cross References: 1 ADD, 1 DELETE
      expect(result.crossReferences.adds.length).toBe(1);
      expect(result.crossReferences.updates.length).toBe(0);
      expect(result.crossReferences.deletes.length).toBe(1);
      expect(result.crossReferences.unchanged.length).toBe(0);

      // Overall summary
      expect(result.summary.totalAdds).toBe(3); // 1 + 1 + 1
      expect(result.summary.totalUpdates).toBe(2); // 1 + 1 + 0
      expect(result.summary.totalDeletes).toBe(1); // 0 + 0 + 1
      expect(result.summary.totalUnchanged).toBe(1); // 0 + 1 + 0
      expect(result.summary.totalChanges).toBe(6); // 3 + 2 + 1
    });
  });
});
