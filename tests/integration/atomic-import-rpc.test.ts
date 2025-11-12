/**
 * Migration 008: execute_atomic_import() RPC Tests
 *
 * Tests the PostgreSQL atomic import function directly via RPC calls.
 * Verifies JSONB parsing, type casting, row counting, and atomicity.
 *
 * Coverage:
 * - Parts operations (6 tests)
 * - Vehicle applications (4 tests)
 * - Cross references (4 tests)
 * - Multi-table atomicity (3 tests)
 * - Edge cases (3 tests)
 *
 * Total: 20 tests
 */

import { randomUUID } from 'crypto';
import { getTestClient } from '../setup/test-client';
import { retryQuery } from '../helpers/retry';

// Use singleton test client with service role key
const supabase = getTestClient();

describe('Parts Operations (execute_atomic_import)', () => {

  test('adds new parts with all fields populated', async () => {
    const partId = randomUUID();

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_add: [
        {
          id: partId,
          acr_sku: `ACR-TEST-${Date.now()}`,
          part_type: 'Rotor',
          position_type: 'Front',
          abs_type: 'ABS',
          bolt_pattern: '5x114.3',
          drive_type: 'FWD',
          specifications: 'Test specifications',
          has_360_viewer: true,
          viewer_360_frame_count: 36,
          updated_by: 'test-user',
        },
      ],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data![0].parts_added).toBe(1);
    expect(data![0].parts_updated).toBe(0);

    // Verify part was actually inserted
    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: part } = await retryQuery<any>(async () =>
      await supabase.from('parts').select('*').eq('id', partId).single()
    );

    expect(part).toBeDefined();
    expect(part!.acr_sku).toContain('ACR-TEST-');
    expect(part!.part_type).toBe('Rotor');
    expect(part!.has_360_viewer).toBe(true);
    expect(part!.viewer_360_frame_count).toBe(36);
    expect(part!.updated_by).toBe('test-user');

    // Cleanup
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('adds parts with minimal fields (NULL handling)', async () => {
    const partId = randomUUID();

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_add: [
        {
          id: partId,
          acr_sku: `ACR-MINIMAL-${Date.now()}`,
          part_type: 'Rotor',
          // Other fields omitted (should be NULL)
        },
      ],
    });

    expect(error).toBeNull();
    expect(data![0].parts_added).toBe(1);

    // Verify NULLs are handled correctly
    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: part } = await retryQuery<any>(async () =>
      await supabase.from('parts').select('*').eq('id', partId).single()
    );

    expect(part!.position_type).toBeNull();
    expect(part!.abs_type).toBeNull();
    expect(part!.bolt_pattern).toBeNull();
    expect(part!.drive_type).toBeNull();
    expect(part!.specifications).toBeNull();
    expect(part!.has_360_viewer).toBe(false); // COALESCE default
    expect(part!.viewer_360_frame_count).toBeNull();
    expect(part!.updated_by).toBe('import'); // COALESCE default

    // Cleanup
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('updates existing parts', async () => {
    // First, create a part
    const partId = randomUUID();
    await supabase.from('parts').insert({
      id: partId,
      acr_sku: `ACR-UPDATE-TEST-${Date.now()}`,
      part_type: 'Rotor',
      position_type: 'Front',
    });

    // Now update it via RPC
    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_update: [
        {
          id: partId,
          acr_sku: `ACR-UPDATED-${Date.now()}`,
          part_type: 'Caliper', // Changed
          position_type: 'Rear', // Changed
          abs_type: 'Non-ABS',
          bolt_pattern: '4x100',
          drive_type: 'RWD',
          specifications: 'Updated specs',
          has_360_viewer: true,
          viewer_360_frame_count: 24,
          updated_by: 'test-updater',
        },
      ],
    });

    expect(error).toBeNull();
    expect(data![0].parts_added).toBe(0);
    expect(data![0].parts_updated).toBe(1);

    // Verify updates applied
    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: part } = await retryQuery<any>(async () =>
      await supabase.from('parts').select('*').eq('id', partId).single()
    );

    expect(part!.part_type).toBe('Caliper');
    expect(part!.position_type).toBe('Rear');
    expect(part!.abs_type).toBe('Non-ABS');
    expect(part!.updated_by).toBe('test-updater');

    // Cleanup
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('verifies row count accuracy for multiple parts', async () => {
    const partIds = [randomUUID(), randomUUID(), randomUUID()];

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_add: partIds.map((id, idx) => ({
        id,
        acr_sku: `ACR-BATCH-${Date.now()}-${idx}`,
        part_type: 'Rotor',
      })),
    });

    expect(error).toBeNull();
    expect(data![0].parts_added).toBe(3);
    expect(data![0].parts_updated).toBe(0);

    // Cleanup
    await supabase.from('parts').delete().in('id', partIds);
  });

  test('tests COALESCE defaults (has_360_viewer, updated_by)', async () => {
    const partId = randomUUID();

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_add: [
        {
          id: partId,
          acr_sku: `ACR-DEFAULTS-${Date.now()}`,
          part_type: 'Rotor',
          // has_360_viewer and updated_by omitted
        },
      ],
    });

    expect(error).toBeNull();

    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: part } = await retryQuery<any>(async () =>
      await supabase.from('parts').select('has_360_viewer, updated_by').eq('id', partId).single()
    );

    expect(part!.has_360_viewer).toBe(false); // COALESCE default
    expect(part!.updated_by).toBe('import'); // COALESCE default

    // Cleanup
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('handles empty parts arrays (skips operation)', async () => {
    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_add: [],
      parts_to_update: [],
    });

    expect(error).toBeNull();
    expect(data![0].parts_added).toBe(0);
    expect(data![0].parts_updated).toBe(0);
  });
});

describe('Vehicle Applications (execute_atomic_import)', () => {

  test('adds new vehicle applications', async () => {
    // Create a part first (foreign key requirement)
    const partId = randomUUID();
    await supabase.from('parts').insert({
      id: partId,
      acr_sku: `ACR-VEHICLE-TEST-${Date.now()}`,
      part_type: 'Rotor',
    });

    const vehicleId = randomUUID();

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      vehicles_to_add: [
        {
          id: vehicleId,
          part_id: partId,
          make: 'HONDA',
          model: 'CIVIC',
          start_year: 2016,
          end_year: 2020,
          updated_by: 'test-user',
        },
      ],
    });

    expect(error).toBeNull();
    expect(data![0].vehicles_added).toBe(1);
    expect(data![0].vehicles_updated).toBe(0);

    // Verify vehicle was inserted
    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: vehicle } = await retryQuery<any>(async () =>
      await supabase.from('vehicle_applications').select('*').eq('id', vehicleId).single()
    );

    expect(vehicle!.part_id).toBe(partId);
    expect(vehicle!.make).toBe('HONDA');
    expect(vehicle!.model).toBe('CIVIC');
    expect(vehicle!.start_year).toBe(2016);
    expect(vehicle!.end_year).toBe(2020);
    expect(vehicle!.updated_by).toBe('test-user');

    // Cleanup
    await supabase.from('vehicle_applications').delete().eq('id', vehicleId);
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('updates existing vehicle applications', async () => {
    // Create part and vehicle
    const partId = randomUUID();
    const vehicleId = randomUUID();

    await supabase.from('parts').insert({
      id: partId,
      acr_sku: `ACR-VEH-UPDATE-${Date.now()}`,
      part_type: 'Rotor',
    });

    await supabase.from('vehicle_applications').insert({
      id: vehicleId,
      part_id: partId,
      make: 'HONDA',
      model: 'CIVIC',
      start_year: 2016,
      end_year: 2020,
    });

    // Update via RPC
    const { data, error } = await supabase.rpc('execute_atomic_import', {
      vehicles_to_update: [
        {
          id: vehicleId,
          part_id: partId,
          make: 'TOYOTA', // Changed
          model: 'CAMRY', // Changed
          start_year: 2018, // Changed
          end_year: 2022, // Changed
          updated_by: 'test-updater',
        },
      ],
    });

    expect(error).toBeNull();
    expect(data![0].vehicles_added).toBe(0);
    expect(data![0].vehicles_updated).toBe(1);

    // Verify updates
    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: vehicle } = await retryQuery<any>(async () =>
      await supabase.from('vehicle_applications').select('*').eq('id', vehicleId).single()
    );

    expect(vehicle!.make).toBe('TOYOTA');
    expect(vehicle!.model).toBe('CAMRY');
    expect(vehicle!.start_year).toBe(2018);
    expect(vehicle!.end_year).toBe(2022);

    // Cleanup
    await supabase.from('vehicle_applications').delete().eq('id', vehicleId);
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('verifies foreign key constraints (part_id must exist)', async () => {
    const vehicleId = randomUUID();
    const nonExistentPartId = randomUUID();

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      vehicles_to_add: [
        {
          id: vehicleId,
          part_id: nonExistentPartId, // Invalid FK
          make: 'HONDA',
          model: 'CIVIC',
          start_year: 2016,
          end_year: 2020,
        },
      ],
    });

    // Should fail due to foreign key violation
    expect(error).not.toBeNull();
    expect(error!.message).toContain('foreign key');
  });

  test('verifies row count accuracy for multiple vehicles', async () => {
    const partId = randomUUID();
    await supabase.from('parts').insert({
      id: partId,
      acr_sku: `ACR-MULTI-VEH-${Date.now()}`,
      part_type: 'Rotor',
    });

    const vehicleIds = [randomUUID(), randomUUID()];

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      vehicles_to_add: vehicleIds.map((id, idx) => ({
        id,
        part_id: partId,
        make: 'HONDA',
        model: idx === 0 ? 'CIVIC' : 'ACCORD',
        start_year: 2016,
        end_year: 2020,
      })),
    });

    expect(error).toBeNull();
    expect(data![0].vehicles_added).toBe(2);

    // Cleanup
    await supabase.from('vehicle_applications').delete().in('id', vehicleIds);
    await supabase.from('parts').delete().eq('id', partId);
  });
});

describe('Cross References (execute_atomic_import)', () => {

  test('adds new cross references', async () => {
    // Create a part first
    const partId = randomUUID();
    await supabase.from('parts').insert({
      id: partId,
      acr_sku: `ACR-XREF-TEST-${Date.now()}`,
      part_type: 'Rotor',
    });

    const crossRefId = randomUUID();

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      cross_refs_to_add: [
        {
          id: crossRefId,
          acr_part_id: partId,
          competitor_brand: 'TrueMotive',
          competitor_sku: `TM-${Date.now()}`,
          updated_by: 'test-user',
        },
      ],
    });

    expect(error).toBeNull();
    expect(data![0].cross_refs_added).toBe(1);
    expect(data![0].cross_refs_updated).toBe(0);

    // Verify cross-reference was inserted
    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: crossRef } = await retryQuery<any>(async () =>
      await supabase.from('cross_references').select('*').eq('id', crossRefId).single()
    );

    expect(crossRef!.acr_part_id).toBe(partId);
    expect(crossRef!.competitor_brand).toBe('TrueMotive');
    expect(crossRef!.updated_by).toBe('test-user');

    // Cleanup
    await supabase.from('cross_references').delete().eq('id', crossRefId);
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('updates existing cross references', async () => {
    // Create part and cross-reference
    const partId = randomUUID();
    const crossRefId = randomUUID();

    await supabase.from('parts').insert({
      id: partId,
      acr_sku: `ACR-XREF-UPD-${Date.now()}`,
      part_type: 'Rotor',
    });

    await supabase.from('cross_references').insert({
      id: crossRefId,
      acr_part_id: partId,
      competitor_brand: 'TrueMotive',
      competitor_sku: 'TM-OLD',
    });

    // Update via RPC
    const { data, error } = await supabase.rpc('execute_atomic_import', {
      cross_refs_to_update: [
        {
          id: crossRefId,
          acr_part_id: partId,
          competitor_brand: 'Centric', // Changed
          competitor_sku: 'CENTRIC-NEW', // Changed
          updated_by: 'test-updater',
        },
      ],
    });

    expect(error).toBeNull();
    expect(data![0].cross_refs_added).toBe(0);
    expect(data![0].cross_refs_updated).toBe(1);

    // Verify updates
    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: crossRef } = await retryQuery<any>(async () =>
      await supabase.from('cross_references').select('*').eq('id', crossRefId).single()
    );

    expect(crossRef!.competitor_brand).toBe('Centric');
    expect(crossRef!.competitor_sku).toBe('CENTRIC-NEW');

    // Cleanup
    await supabase.from('cross_references').delete().eq('id', crossRefId);
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('verifies foreign key constraints (acr_part_id must exist)', async () => {
    const crossRefId = randomUUID();
    const nonExistentPartId = randomUUID();

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      cross_refs_to_add: [
        {
          id: crossRefId,
          acr_part_id: nonExistentPartId, // Invalid FK
          competitor_brand: 'TrueMotive',
          competitor_sku: 'TM-TEST',
        },
      ],
    });

    // Should fail due to foreign key violation
    expect(error).not.toBeNull();
    expect(error!.message).toContain('foreign key');
  });

  test('verifies row count accuracy for multiple cross-refs', async () => {
    const partId = randomUUID();
    await supabase.from('parts').insert({
      id: partId,
      acr_sku: `ACR-MULTI-XREF-${Date.now()}`,
      part_type: 'Rotor',
    });

    const crossRefIds = [randomUUID(), randomUUID(), randomUUID()];

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      cross_refs_to_add: crossRefIds.map((id, idx) => ({
        id,
        acr_part_id: partId,
        competitor_brand: idx === 0 ? 'TrueMotive' : idx === 1 ? 'Centric' : 'Wagner',
        competitor_sku: `COMP-${idx}`,
      })),
    });

    expect(error).toBeNull();
    expect(data![0].cross_refs_added).toBe(3);

    // Cleanup
    await supabase.from('cross_references').delete().in('id', crossRefIds);
    await supabase.from('parts').delete().eq('id', partId);
  });
});

describe('Multi-Table Atomicity (execute_atomic_import)', () => {

  test('adds parts + vehicles + cross-refs in single transaction', async () => {
    const partId = randomUUID();
    const vehicleId = randomUUID();
    const crossRefId = randomUUID();

    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_add: [
        {
          id: partId,
          acr_sku: `ACR-ATOMIC-${Date.now()}`,
          part_type: 'Rotor',
        },
      ],
      vehicles_to_add: [
        {
          id: vehicleId,
          part_id: partId,
          make: 'HONDA',
          model: 'CIVIC',
          start_year: 2016,
          end_year: 2020,
        },
      ],
      cross_refs_to_add: [
        {
          id: crossRefId,
          acr_part_id: partId,
          competitor_brand: 'TrueMotive',
          competitor_sku: `TM-${Date.now()}`,
        },
      ],
    });

    expect(error).toBeNull();
    expect(data![0].parts_added).toBe(1);
    expect(data![0].vehicles_added).toBe(1);
    expect(data![0].cross_refs_added).toBe(1);

    // Verify all records exist
    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: part } = await retryQuery<any>(async () =>
      await supabase.from('parts').select('*').eq('id', partId).single()
    );
    const { data: vehicle } = await retryQuery<any>(async () =>
      await supabase.from('vehicle_applications').select('*').eq('id', vehicleId).single()
    );
    const { data: crossRef } = await retryQuery<any>(async () =>
      await supabase.from('cross_references').select('*').eq('id', crossRefId).single()
    );

    expect(part).toBeDefined();
    expect(vehicle).toBeDefined();
    expect(crossRef).toBeDefined();

    // Cleanup (reverse FK order)
    await supabase.from('cross_references').delete().eq('id', crossRefId);
    await supabase.from('vehicle_applications').delete().eq('id', vehicleId);
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('updates across all 3 tables simultaneously', async () => {
    // Setup existing data
    const partId = randomUUID();
    const vehicleId = randomUUID();
    const crossRefId = randomUUID();

    await supabase.from('parts').insert({
      id: partId,
      acr_sku: `ACR-UPDATE-ALL-${Date.now()}`,
      part_type: 'Rotor',
    });

    await supabase.from('vehicle_applications').insert({
      id: vehicleId,
      part_id: partId,
      make: 'HONDA',
      model: 'CIVIC',
      start_year: 2016,
      end_year: 2020,
    });

    await supabase.from('cross_references').insert({
      id: crossRefId,
      acr_part_id: partId,
      competitor_brand: 'TrueMotive',
      competitor_sku: 'TM-OLD',
    });

    // Update all via RPC
    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_update: [
        {
          id: partId,
          acr_sku: `ACR-UPDATED-ALL-${Date.now()}`,
          part_type: 'Caliper', // Changed
        },
      ],
      vehicles_to_update: [
        {
          id: vehicleId,
          part_id: partId,
          make: 'TOYOTA', // Changed
          model: 'CAMRY',
          start_year: 2018,
          end_year: 2022,
        },
      ],
      cross_refs_to_update: [
        {
          id: crossRefId,
          acr_part_id: partId,
          competitor_brand: 'Centric', // Changed
          competitor_sku: 'CENTRIC-NEW',
        },
      ],
    });

    expect(error).toBeNull();
    expect(data![0].parts_updated).toBe(1);
    expect(data![0].vehicles_updated).toBe(1);
    expect(data![0].cross_refs_updated).toBe(1);

    // Cleanup
    await supabase.from('cross_references').delete().eq('id', crossRefId);
    await supabase.from('vehicle_applications').delete().eq('id', vehicleId);
    await supabase.from('parts').delete().eq('id', partId);
  });

  test('verifies all-or-nothing rollback on ANY failure', async () => {
    const partId = randomUUID();
    const vehicleId = randomUUID();
    const nonExistentPartId = randomUUID(); // Invalid FK for cross-ref

    // This should fail because cross-ref references non-existent part
    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_add: [
        {
          id: partId,
          acr_sku: `ACR-ROLLBACK-TEST-${Date.now()}`,
          part_type: 'Rotor',
        },
      ],
      vehicles_to_add: [
        {
          id: vehicleId,
          part_id: partId,
          make: 'HONDA',
          model: 'CIVIC',
          start_year: 2016,
          end_year: 2020,
        },
      ],
      cross_refs_to_add: [
        {
          id: randomUUID(),
          acr_part_id: nonExistentPartId, // INVALID - will cause FK violation
          competitor_brand: 'TrueMotive',
          competitor_sku: 'TM-FAIL',
        },
      ],
    });

    // Should fail
    expect(error).not.toBeNull();

    // Verify NOTHING was inserted (complete rollback)
    const { data: part } = await supabase.from('parts').select('*').eq('id', partId).single();
    const { data: vehicle } = await supabase.from('vehicle_applications').select('*').eq('id', vehicleId).single();

    expect(part).toBeNull(); // Part should NOT exist (rolled back)
    expect(vehicle).toBeNull(); // Vehicle should NOT exist (rolled back)
  });
});

describe('Edge Cases (execute_atomic_import)', () => {

  test('all empty arrays (no-op, returns zeros)', async () => {
    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_add: [],
      parts_to_update: [],
      vehicles_to_add: [],
      vehicles_to_update: [],
      cross_refs_to_add: [],
      cross_refs_to_update: [],
    });

    expect(error).toBeNull();
    expect(data![0].parts_added).toBe(0);
    expect(data![0].parts_updated).toBe(0);
    expect(data![0].vehicles_added).toBe(0);
    expect(data![0].vehicles_updated).toBe(0);
    expect(data![0].cross_refs_added).toBe(0);
    expect(data![0].cross_refs_updated).toBe(0);
  });

  test('JSONB type casting (invalid UUID should fail)', async () => {
    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_add: [
        {
          id: 'not-a-valid-uuid', // Invalid UUID format
          acr_sku: 'ACR-INVALID',
          part_type: 'Rotor',
        },
      ],
    });

    // Should fail due to invalid UUID casting
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/invalid input syntax for type uuid|uuid/i);
  });

  // SKIPPED: Multi-tenant support not yet implemented
  // TODO: Re-enable when tenant_id filtering is fully implemented
  test.skip('tenant filtering (verify only correct tenant updated)', async () => {
    // Create 2 parts with different tenant IDs
    const tenant1Id = randomUUID();
    const tenant2Id = randomUUID();
    const part1Id = randomUUID();
    const part2Id = randomUUID();

    await supabase.from('parts').insert([
      {
        id: part1Id,
        tenant_id: tenant1Id,
        acr_sku: `ACR-TENANT1-${Date.now()}`,
        part_type: 'Rotor',
      },
      {
        id: part2Id,
        tenant_id: tenant2Id,
        acr_sku: `ACR-TENANT2-${Date.now()}`,
        part_type: 'Rotor',
      },
    ]);

    // Update both parts, but with tenant_id_filter for tenant1 only
    const { data, error } = await supabase.rpc('execute_atomic_import', {
      parts_to_update: [
        {
          id: part1Id,
          acr_sku: `ACR-T1-UPDATED-${Date.now()}`,
          part_type: 'Caliper',
        },
        {
          id: part2Id,
          acr_sku: `ACR-T2-UPDATED-${Date.now()}`,
          part_type: 'Caliper',
        },
      ],
      tenant_id_filter: tenant1Id, // Only update tenant1's parts
    });

    expect(error).toBeNull();
    expect(data![0].parts_updated).toBe(1); // Only 1 part updated (tenant1)

    // Verify part1 was updated, part2 was NOT
    // Note: Using retryQuery to handle PostgREST cache delay after RPC write
    const { data: part1 } = await retryQuery<any>(async () =>
      await supabase.from('parts').select('part_type').eq('id', part1Id).single()
    );
    const { data: part2 } = await retryQuery<any>(async () =>
      await supabase.from('parts').select('part_type').eq('id', part2Id).single()
    );

    expect(part1!.part_type).toBe('Caliper'); // Updated
    expect(part2!.part_type).toBe('Rotor'); // NOT updated (different tenant)

    // Cleanup
    await supabase.from('parts').delete().in('id', [part1Id, part2Id]);
  });
});
