/**
 * RollbackService Integration Tests
 *
 * Tests the rollback functionality including:
 * - Sequential rollback enforcement (newest first)
 * - 3-snapshot limit
 * - Snapshot restoration accuracy (100% data fidelity)
 * - Conflict detection (manual edits after import)
 * - Orphaned record cleanup
 * - Golden baseline preservation
 *
 * Coverage:
 * - Sequential enforcement (3 tests)
 * - Conflict detection (3 tests)
 * - Data restoration (4 tests)
 * - Snapshot management (3 tests)
 * - Edge cases (3 tests)
 *
 * Total: 16 tests
 */

import { randomUUID } from 'crypto';
import { getTestClient } from '../setup/test-client';
import { RollbackService } from '@/services/excel/rollback/RollbackService';
import type { SnapshotData } from '@/services/excel/import/types';
import { TEST_SNAPSHOT_MARKER } from '../helpers/test-snapshot';

// Helper type for creating test snapshots (timestamp is auto-added by helper)
type TestSnapshotData = Omit<SnapshotData, 'timestamp'>;

// Use singleton test client with service role key
const supabase = getTestClient();

// Pass service role client to RollbackService for tests
const rollbackService = new RollbackService(supabase);

/**
 * Test helper: Create import snapshot in database
 */
async function createImportSnapshot(params: {
  fileName: string;
  snapshotData: {
    parts: any[];
    vehicle_applications: any[];
    cross_references: any[];
    timestamp?: string;
  };
  createdAt?: string;
}): Promise<string> {
  // Ensure snapshot_data has required timestamp field for check constraint
  const snapshotWithTimestamp: SnapshotData = {
    parts: params.snapshotData.parts,
    vehicle_applications: params.snapshotData.vehicle_applications,
    cross_references: params.snapshotData.cross_references,
    timestamp: params.snapshotData.timestamp || params.createdAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('import_history')
    .insert({
      file_name: params.fileName,
      rows_imported:
        params.snapshotData.parts.length +
        params.snapshotData.vehicle_applications.length +
        params.snapshotData.cross_references.length,
      snapshot_data: snapshotWithTimestamp,
      import_summary: {
        adds: params.snapshotData.parts.length,
        updates: 0,
        deletes: 0,
      },
      imported_by: 'test-user',
      created_at: params.createdAt,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create snapshot: ${error.message}`);
  return data!.id;
}

/**
 * Test helper: Clean up database
 */
async function cleanup() {
  // Delete all test data
  await supabase.from('cross_references').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('vehicle_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('parts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // Preserve only global test snapshot created by run-all-tests.ts
  await supabase.from('import_history').delete().neq('id', '00000000-0000-0000-0000-000000000000').neq('file_name', TEST_SNAPSHOT_MARKER);
}

describe('RollbackService - Sequential Enforcement', () => {
  beforeEach(async () => await cleanup());
  afterEach(async () => await cleanup());

  test('should allow rollback of newest import', async () => {
    // Create empty snapshot
    const snapshotData: TestSnapshotData = {
      parts: [],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-import-1.xlsx',
      snapshotData,
    });

    // Should not throw
    const result = await rollbackService.rollbackToImport(importId);

    expect(result.success).toBe(true);
    expect(result.importId).toBe(importId);
  });

  test('should block rollback of older import (sequential enforcement)', async () => {
    const timestamp1 = new Date('2025-01-01T10:00:00Z').toISOString();
    const timestamp2 = new Date('2025-01-01T11:00:00Z').toISOString();

    const snapshotData1: SnapshotData = {
      parts: [],
      vehicle_applications: [],
      cross_references: [],
      timestamp: timestamp1,
    };

    const snapshotData2: SnapshotData = {
      parts: [],
      vehicle_applications: [],
      cross_references: [],
      timestamp: timestamp2,
    };

    // Create two imports (different timestamps)
    const import1 = await createImportSnapshot({
      fileName: 'test-import-1.xlsx',
      snapshotData: snapshotData1,
      createdAt: timestamp1,
    });

    const import2 = await createImportSnapshot({
      fileName: 'test-import-2.xlsx',
      snapshotData: snapshotData2,
      createdAt: timestamp2,
    });

    // Try to rollback older import (should fail)
    try {
      await rollbackService.rollbackToImport(import1);
      fail('Expected rollback to throw error but it succeeded');
    } catch (error: any) {
      console.log('Caught error:', error);
      console.log('Error message:', error.message);
      console.log('Error name:', error.name);
      expect(error.message).toContain('Sequential rollback enforced');
    }
  });

  test('should enforce 3-snapshot limit (only last 3 snapshots available)', async () => {
    const snapshotData: TestSnapshotData = {
      parts: [],
      vehicle_applications: [],
      cross_references: [],
    };

    // Create 4 imports
    await createImportSnapshot({
      fileName: 'import-1.xlsx',
      snapshotData,
      createdAt: new Date('2025-01-01T10:00:00Z').toISOString(),
    });

    await createImportSnapshot({
      fileName: 'import-2.xlsx',
      snapshotData,
      createdAt: new Date('2025-01-01T11:00:00Z').toISOString(),
    });

    await createImportSnapshot({
      fileName: 'import-3.xlsx',
      snapshotData,
      createdAt: new Date('2025-01-01T12:00:00Z').toISOString(),
    });

    await createImportSnapshot({
      fileName: 'import-4.xlsx',
      snapshotData,
      createdAt: new Date('2025-01-01T13:00:00Z').toISOString(),
    });

    // List available snapshots
    const snapshots = await rollbackService.listAvailableSnapshots();

    // Filter to only snapshots created by this test (exclude test infrastructure)
    const testSnapshots = snapshots.filter(s => s.file_name.startsWith('import-'));

    // Should return top 3 from the 4 we created (import-4, import-3, import-2)
    // Note: May have fewer if test infrastructure snapshots take up slots
    expect(testSnapshots.length).toBeGreaterThanOrEqual(2);
    expect(testSnapshots.length).toBeLessThanOrEqual(3);

    // Verify the newest ones are present and ordered correctly
    expect(testSnapshots[0].file_name).toBe('import-4.xlsx');
    if (testSnapshots.length >= 2) {
      expect(testSnapshots[1].file_name).toBe('import-3.xlsx');
    }
    if (testSnapshots.length >= 3) {
      expect(testSnapshots[2].file_name).toBe('import-2.xlsx');
    }
  });
});

describe('RollbackService - Conflict Detection', () => {
  beforeEach(async () => await cleanup());
  afterEach(async () => await cleanup());

  test('should detect manual edits after import and block rollback', async () => {
    const partId = randomUUID();

    // Create part
    await supabase.from('parts').insert({
      id: partId,
      acr_sku: 'ACR-CONFLICT-TEST',
      part_type: 'Rotor',
      updated_by: 'import',
    });

    // Create snapshot
    const snapshotData: TestSnapshotData = {
      parts: [{
        id: partId,
        acr_sku: 'ACR-CONFLICT-TEST',
        part_type: 'Rotor',
        updated_by: 'import',
      }],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-import.xlsx',
      snapshotData,
    });

    // Wait 1 second to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Manually edit the part AFTER import
    await supabase
      .from('parts')
      .update({
        part_type: 'Caliper',
        updated_by: 'manual', // Manual edit marker
        updated_at: new Date().toISOString(),
      })
      .eq('id', partId);

    // Try to rollback (should detect conflict)
    try {
      await rollbackService.rollbackToImport(importId);
      fail('Expected rollback to throw conflict error but it succeeded');
    } catch (error: any) {
      expect(error.message).toContain('manually edited after this import');
    }
  });

  test('should allow rollback when no manual edits detected', async () => {
    const partId = randomUUID();

    const snapshotData: TestSnapshotData = {
      parts: [{
        id: partId,
        acr_sku: 'ACR-NO-CONFLICT',
        part_type: 'Rotor',
        updated_by: 'import',
      }],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-import.xlsx',
      snapshotData,
    });

    // Insert the part (no manual edits)
    await supabase.from('parts').insert({
      id: partId,
      acr_sku: 'ACR-NO-CONFLICT',
      part_type: 'Rotor',
      updated_by: 'import',
    });

    // Should not throw
    const result = await rollbackService.rollbackToImport(importId);
    expect(result.success).toBe(true);
  });

  test('should ignore edits by "import" user (not considered conflicts)', async () => {
    const partId = randomUUID();

    const snapshotData: TestSnapshotData = {
      parts: [{
        id: partId,
        acr_sku: 'ACR-IMPORT-EDIT',
        part_type: 'Rotor',
        updated_by: 'import',
      }],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-import.xlsx',
      snapshotData,
    });

    // Insert part
    await supabase.from('parts').insert({
      id: partId,
      acr_sku: 'ACR-IMPORT-EDIT',
      part_type: 'Rotor',
      updated_by: 'import',
    });

    // Wait and update via another import (updated_by = 'import')
    await new Promise(resolve => setTimeout(resolve, 1000));
    await supabase
      .from('parts')
      .update({
        part_type: 'Caliper',
        updated_by: 'import', // Import edit, not manual
        updated_at: new Date().toISOString(),
      })
      .eq('id', partId);

    // Should allow rollback (import edits don't count as conflicts)
    const result = await rollbackService.rollbackToImport(importId);
    expect(result.success).toBe(true);
  });
});

describe('RollbackService - Data Restoration', () => {
  beforeEach(async () => await cleanup());
  afterEach(async () => await cleanup());

  test('should restore all parts with 100% accuracy', async () => {
    const part1Id = randomUUID();
    const part2Id = randomUUID();

    const snapshotData: TestSnapshotData = {
      parts: [
        {
          id: part1Id,
          acr_sku: 'ACR-RESTORE-1',
          part_type: 'Rotor',
          position_type: 'Front',
          has_360_viewer: true,
          viewer_360_frame_count: 36,
          updated_by: 'import',
        },
        {
          id: part2Id,
          acr_sku: 'ACR-RESTORE-2',
          part_type: 'Caliper',
          position_type: 'Rear',
          has_360_viewer: false,
          updated_by: 'import',
        },
      ],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-restore.xlsx',
      snapshotData,
    });

    // Rollback to restore data
    const result = await rollbackService.rollbackToImport(importId);

    expect(result.success).toBe(true);
    expect(result.restoredCounts.parts).toBe(2);

    // Verify parts restored with exact data
    const { data: parts } = await supabase
      .from('parts')
      .select('*')
      .in('id', [part1Id, part2Id])
      .order('acr_sku');

    expect(parts).toHaveLength(2);
    expect(parts![0].acr_sku).toBe('ACR-RESTORE-1');
    expect(parts![0].part_type).toBe('Rotor');
    expect(parts![0].has_360_viewer).toBe(true);
    expect(parts![0].viewer_360_frame_count).toBe(36);

    expect(parts![1].acr_sku).toBe('ACR-RESTORE-2');
    expect(parts![1].part_type).toBe('Caliper');
    expect(parts![1].has_360_viewer).toBe(false);
  });

  test('should restore vehicle applications with foreign key integrity', async () => {
    const partId = randomUUID();
    const vehicleId = randomUUID();

    const snapshotData: TestSnapshotData = {
      parts: [{
        id: partId,
        acr_sku: 'ACR-VEHICLE-TEST',
        part_type: 'Rotor',
        updated_by: 'import',
      }],
      vehicle_applications: [{
        id: vehicleId,
        part_id: partId, // FK to part
        make: 'HONDA',
        model: 'CIVIC',
        start_year: 2016,
        end_year: 2020,
        updated_by: 'import',
      }],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-fk.xlsx',
      snapshotData,
    });

    const result = await rollbackService.rollbackToImport(importId);

    expect(result.success).toBe(true);
    expect(result.restoredCounts.parts).toBe(1);
    expect(result.restoredCounts.vehicleApplications).toBe(1);

    // Verify FK relationship maintained
    const { data: vehicle } = await supabase
      .from('vehicle_applications')
      .select('*, parts(acr_sku)')
      .eq('id', vehicleId)
      .single();

    expect(vehicle).toBeDefined();
    expect(vehicle!.part_id).toBe(partId);
    expect((vehicle!.parts as any).acr_sku).toBe('ACR-VEHICLE-TEST');
  });

  test('should restore cross references with foreign key integrity', async () => {
    const partId = randomUUID();
    const crossRefId = randomUUID();

    const snapshotData: TestSnapshotData = {
      parts: [{
        id: partId,
        acr_sku: 'ACR-XREF-TEST',
        part_type: 'Rotor',
        updated_by: 'import',
      }],
      vehicle_applications: [],
      cross_references: [{
        id: crossRefId,
        acr_part_id: partId, // FK to part
        competitor_brand: 'TrueMotive',
        competitor_sku: 'TM-12345',
        updated_by: 'import',
      }],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-xref.xlsx',
      snapshotData,
    });

    const result = await rollbackService.rollbackToImport(importId);

    expect(result.success).toBe(true);
    expect(result.restoredCounts.crossReferences).toBe(1);

    // Verify FK relationship maintained
    const { data: crossRef } = await supabase
      .from('cross_references')
      .select('*, parts(acr_sku)')
      .eq('id', crossRefId)
      .single();

    expect(crossRef).toBeDefined();
    expect(crossRef!.acr_part_id).toBe(partId);
    expect((crossRef!.parts as any).acr_sku).toBe('ACR-XREF-TEST');
  });

  test('should delete ALL current data before restoring snapshot', async () => {
    // Create current data that should be deleted
    const currentPartId = randomUUID();
    await supabase.from('parts').insert({
      id: currentPartId,
      acr_sku: 'ACR-TO-BE-DELETED',
      part_type: 'Rotor',
      updated_by: 'import',
    });

    // Create snapshot with different part
    const snapshotPartId = randomUUID();
    const snapshotData: TestSnapshotData = {
      parts: [{
        id: snapshotPartId,
        acr_sku: 'ACR-FROM-SNAPSHOT',
        part_type: 'Caliper',
        updated_by: 'import',
      }],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-delete-current.xlsx',
      snapshotData,
    });

    await rollbackService.rollbackToImport(importId);

    // Current part should be deleted
    const { data: deletedPart } = await supabase
      .from('parts')
      .select('*')
      .eq('id', currentPartId)
      .single();

    expect(deletedPart).toBeNull();

    // Snapshot part should exist
    const { data: restoredPart } = await supabase
      .from('parts')
      .select('*')
      .eq('id', snapshotPartId)
      .single();

    expect(restoredPart).toBeDefined();
    expect(restoredPart!.acr_sku).toBe('ACR-FROM-SNAPSHOT');
  });
});

describe('RollbackService - Snapshot Management', () => {
  beforeEach(async () => await cleanup());
  afterEach(async () => await cleanup());

  test('should delete consumed snapshot after successful rollback', async () => {
    const snapshotData: TestSnapshotData = {
      parts: [],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-delete-snapshot.xlsx',
      snapshotData,
    });

    await rollbackService.rollbackToImport(importId);

    // Snapshot should be deleted
    const { data: snapshot } = await supabase
      .from('import_history')
      .select('*')
      .eq('id', importId)
      .single();

    expect(snapshot).toBeNull();
  });

  test('should preserve golden baseline snapshot (never deleted)', async () => {
    const snapshotData: TestSnapshotData = {
      parts: [],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'GOLDEN_BASELINE_877.xlsx', // Golden baseline filename
      snapshotData,
    });

    await rollbackService.rollbackToImport(importId);

    // Golden baseline should NOT be deleted
    const { data: snapshot } = await supabase
      .from('import_history')
      .select('*')
      .eq('id', importId)
      .single();

    expect(snapshot).toBeDefined();
    expect(snapshot!.file_name).toBe('GOLDEN_BASELINE_877.xlsx');
  });

  test('should list available snapshots (max 3, newest first)', async () => {
    const snapshotData: TestSnapshotData = {
      parts: [],
      vehicle_applications: [],
      cross_references: [],
    };

    await createImportSnapshot({
      fileName: 'import-1.xlsx',
      snapshotData,
      createdAt: new Date('2025-01-01T10:00:00Z').toISOString(),
    });

    await createImportSnapshot({
      fileName: 'import-2.xlsx',
      snapshotData,
      createdAt: new Date('2025-01-01T11:00:00Z').toISOString(),
    });

    await createImportSnapshot({
      fileName: 'import-3.xlsx',
      snapshotData,
      createdAt: new Date('2025-01-01T12:00:00Z').toISOString(),
    });

    const snapshots = await rollbackService.listAvailableSnapshots();

    // Filter to only snapshots created by this test (exclude test infrastructure like GOLDEN_BASELINE)
    const testSnapshots = snapshots.filter(s => s.file_name.startsWith('import-'));

    // Should return all 3 we created, ordered newest first
    // Note: May have fewer if test infrastructure snapshots take up slots in the limit of 3
    expect(testSnapshots.length).toBeGreaterThanOrEqual(2);
    expect(testSnapshots.length).toBeLessThanOrEqual(3);

    // Verify ordering (newest first)
    expect(testSnapshots[0].file_name).toBe('import-3.xlsx');
    if (testSnapshots.length >= 2) {
      expect(testSnapshots[1].file_name).toBe('import-2.xlsx');
    }
    if (testSnapshots.length >= 3) {
      expect(testSnapshots[2].file_name).toBe('import-1.xlsx');
    }
  });
});

describe('RollbackService - Edge Cases', () => {
  beforeEach(async () => await cleanup());
  afterEach(async () => await cleanup());

  test('should handle empty snapshot (no data to restore)', async () => {
    const snapshotData: TestSnapshotData = {
      parts: [],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'empty-snapshot.xlsx',
      snapshotData,
    });

    const result = await rollbackService.rollbackToImport(importId);

    expect(result.success).toBe(true);
    expect(result.restoredCounts.parts).toBe(0);
    expect(result.restoredCounts.vehicleApplications).toBe(0);
    expect(result.restoredCounts.crossReferences).toBe(0);
  });

  test('should reject rollback of non-existent import', async () => {
    const fakeImportId = randomUUID();

    await expect(
      rollbackService.rollbackToImport(fakeImportId)
    ).rejects.toThrow('No import snapshots available');
  });

  test('should track execution time', async () => {
    const snapshotData: TestSnapshotData = {
      parts: [],
      vehicle_applications: [],
      cross_references: [],
    };

    const importId = await createImportSnapshot({
      fileName: 'test-timing.xlsx',
      snapshotData,
    });

    const result = await rollbackService.rollbackToImport(importId);

    expect(result.executionTimeMs).toBeDefined();
    expect(result.executionTimeMs!).toBeGreaterThan(0);
    expect(result.executionTimeMs!).toBeLessThan(30000); // Should complete within 30s
  });
});
