#!/usr/bin/env tsx
/**
 * Export Full Seed Data from Staging DB
 *
 * This script connects to the remote Supabase Staging (TEST) DB and exports ALL parts data
 * to create a complete baseline for local testing.
 *
 * Strategy:
 * - Export ALL parts from Staging DB (865 parts)
 * - Include ALL related vehicle_applications and cross_references
 * - Generate deterministic UUIDs for reproducible testing
 * - Output to fixtures/seed-data.sql
 * - This becomes the single source of truth for local Docker testing
 *
 * Usage:
 *   npm run staging:export (uses .env.staging)
 *
 * Requires NODE_ENV=staging to be set by npm script
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

// Load staging environment
if (process.env.NODE_ENV === ("staging" as string)) {
  dotenv.config({ path: path.join(process.cwd(), '.env.staging'), override: true });
} else {
  console.error("❌ ERROR: This script must be run with NODE_ENV=staging");
  console.error("   Use: npm run staging:export");
  process.exit(1);
}

interface Part {
  id: string;
  acr_sku: string;
  part_type: string;
  position_type: string | null;
  abs_type: string | null;
  bolt_pattern: string | null;
  drive_type: string | null;
  specifications: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface VehicleApplication {
  id: string;
  part_id: string;
  make: string;
  model: string;
  start_year: number;
  end_year: number;
  created_at: string;
  updated_at: string;
}

interface CrossReference {
  id: string;
  acr_part_id: string;
  competitor_sku: string;
  competitor_brand: string | null;
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 1000;

async function exportSeedSnapshot() {
  console.log('🔄 Connecting to remote Test DB...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env.test');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📊 Exporting ALL parts from remote Test DB (with pagination)...');

  // Fetch all parts with pagination
  const allParts: Part[] = [];
  let partsPage = 0;

  while (true) {
    const { data: partsBatch, error: partsError } = await supabase
      .from('parts')
      .select('*')
      .order('acr_sku')
      .range(partsPage * PAGE_SIZE, (partsPage + 1) * PAGE_SIZE - 1);

    if (partsError) throw partsError;
    if (!partsBatch || partsBatch.length === 0) break;

    allParts.push(...partsBatch);
    partsPage++;

    if (partsBatch.length < PAGE_SIZE) break; // Last page
  }

  const selectedParts = allParts;
  console.log(`✅ Exported ${selectedParts.length} parts (${partsPage} pages)`);

  // Fetch all vehicle applications with pagination
  const allVehicles: VehicleApplication[] = [];
  let vaPage = 0;

  while (true) {
    const { data: vaBatch, error: vehicleError } = await supabase
      .from('vehicle_applications')
      .select('*')
      .order('part_id')
      .range(vaPage * PAGE_SIZE, (vaPage + 1) * PAGE_SIZE - 1);

    if (vehicleError) throw vehicleError;
    if (!vaBatch || vaBatch.length === 0) break;

    allVehicles.push(...vaBatch);
    vaPage++;

    if (vaBatch.length < PAGE_SIZE) break; // Last page
  }

  const vehicles = allVehicles;
  console.log(`✅ Found ${vehicles?.length || 0} vehicle applications (${vaPage} pages)`);

  // Fetch all cross references with pagination
  const allCrossRefs: CrossReference[] = [];
  let crPage = 0;

  while (true) {
    const { data: crBatch, error: crossRefError } = await supabase
      .from('cross_references')
      .select('*')
      .order('acr_part_id')
      .range(crPage * PAGE_SIZE, (crPage + 1) * PAGE_SIZE - 1);

    if (crossRefError) throw crossRefError;
    if (!crBatch || crBatch.length === 0) break;

    allCrossRefs.push(...crBatch);
    crPage++;

    if (crBatch.length < PAGE_SIZE) break; // Last page
  }

  const crossRefs = allCrossRefs;
  console.log(`✅ Found ${crossRefs?.length || 0} cross references (${crPage} pages)`);

  // Generate SQL with deterministic UUIDs
  console.log('\n📝 Generating SQL seed file...');

  const sqlLines: string[] = [];

  sqlLines.push('-- ============================================================================');
  sqlLines.push('-- ACR Automotive Test Seed Data');
  sqlLines.push(`-- Generated: ${new Date().toISOString()}`);
  sqlLines.push(`-- Source: Remote Test DB (${supabaseUrl})`);
  sqlLines.push(`-- Parts: ${selectedParts.length}`);
  sqlLines.push(`-- Vehicle Applications: ${vehicles?.length || 0}`);
  sqlLines.push(`-- Cross References: ${crossRefs?.length || 0}`);
  sqlLines.push('-- ============================================================================');
  sqlLines.push('');
  sqlLines.push('-- Clean existing data');
  sqlLines.push('TRUNCATE TABLE parts CASCADE;');
  sqlLines.push('');

  // Create UUID mapping (original -> deterministic)
  const uuidMap = new Map<string, string>();
  selectedParts.forEach((part, idx) => {
    const deterministicUuid = `00000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`;
    uuidMap.set(part.id, deterministicUuid);
  });

  // Insert parts
  sqlLines.push('-- ============================================================================');
  sqlLines.push('-- PARTS');
  sqlLines.push('-- ============================================================================');
  sqlLines.push('-- Note: image_url column removed by Migration 001 (moved to part_images table)');
  sqlLines.push('INSERT INTO parts (id, acr_sku, part_type, position_type, abs_type, bolt_pattern, drive_type, specifications, created_at, updated_at) VALUES');

  const partInserts = selectedParts.map((part, idx) => {
    const id = uuidMap.get(part.id)!;
    const values = [
      `'${id}'`,
      `'${escapeSql(part.acr_sku)}'`,
      `'${escapeSql(part.part_type)}'`,
      part.position_type ? `'${escapeSql(part.position_type)}'` : 'NULL',
      part.abs_type ? `'${escapeSql(part.abs_type)}'` : 'NULL',
      part.bolt_pattern ? `'${escapeSql(part.bolt_pattern)}'` : 'NULL',
      part.drive_type ? `'${escapeSql(part.drive_type)}'` : 'NULL',
      part.specifications ? `'${escapeSql(part.specifications)}'` : 'NULL',
      'NOW()',
      'NOW()',
    ];
    return `  (${values.join(', ')})`;
  });

  sqlLines.push(partInserts.join(',\n'));
  sqlLines.push(';');
  sqlLines.push('');

  // Insert vehicle applications (with deduplication)
  if (vehicles && vehicles.length > 0) {
    sqlLines.push('-- ============================================================================');
    sqlLines.push('-- VEHICLE APPLICATIONS');
    sqlLines.push('-- ============================================================================');
    sqlLines.push('INSERT INTO vehicle_applications (id, part_id, make, model, start_year, end_year, created_at, updated_at) VALUES');

    const vehicleSet = new Set<string>(); // Track unique combinations
    const vehicleInserts = vehicles.map((vehicle, idx) => {
      const partId = uuidMap.get(vehicle.part_id);

      // Skip if part was not selected
      if (!partId) return null;

      // Deduplicate by unique constraint key (part_id, make, model, start_year)
      const uniqueKey = `${partId}|${vehicle.make}|${vehicle.model}|${vehicle.start_year}`;
      if (vehicleSet.has(uniqueKey)) return null; // Skip duplicate
      vehicleSet.add(uniqueKey);

      const id = `10000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`;
      const values = [
        `'${id}'`,
        `'${partId}'`,
        `'${escapeSql(vehicle.make)}'`,
        `'${escapeSql(vehicle.model)}'`,
        vehicle.start_year,
        vehicle.end_year,
        'NOW()',
        'NOW()',
      ];
      return `  (${values.join(', ')})`;
    }).filter(Boolean);

    sqlLines.push(vehicleInserts.join(',\n'));
    sqlLines.push(';');
    sqlLines.push('');
  }

  // Insert cross references (with deduplication)
  if (crossRefs && crossRefs.length > 0) {
    sqlLines.push('-- ============================================================================');
    sqlLines.push('-- CROSS REFERENCES');
    sqlLines.push('-- ============================================================================');
    sqlLines.push('INSERT INTO cross_references (id, acr_part_id, competitor_sku, competitor_brand, created_at, updated_at) VALUES');

    const crossRefSet = new Set<string>(); // Track unique combinations
    const crossRefInserts = crossRefs.map((crossRef, idx) => {
      const partId = uuidMap.get(crossRef.acr_part_id);

      // Skip if part was not selected
      if (!partId) return null;

      // Deduplicate by unique constraint key (acr_part_id, competitor_sku, competitor_brand)
      const uniqueKey = `${partId}|${crossRef.competitor_sku}|${crossRef.competitor_brand || ''}`;
      if (crossRefSet.has(uniqueKey)) return null; // Skip duplicate
      crossRefSet.add(uniqueKey);

      const id = `20000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`;
      const values = [
        `'${id}'`,
        `'${partId}'`,
        `'${escapeSql(crossRef.competitor_sku)}'`,
        crossRef.competitor_brand ? `'${escapeSql(crossRef.competitor_brand)}'` : 'NULL',
        'NOW()',
        'NOW()',
      ];
      return `  (${values.join(', ')})`;
    }).filter(Boolean);

    sqlLines.push(crossRefInserts.join(',\n'));
    sqlLines.push(';');
    sqlLines.push('');
  }

  // Write to file
  const outputPath = path.join(process.cwd(), 'fixtures', 'seed-data.sql');
  await fs.writeFile(outputPath, sqlLines.join('\n'), 'utf-8');

  console.log(`\n✅ Seed data exported to: fixtures/seed-data.sql`);
  console.log(`\n📊 Summary:`);
  console.log(`   Parts: ${selectedParts.length}`);
  console.log(`   Vehicle Applications: ${vehicles?.length || 0}`);
  console.log(`   Cross References: ${crossRefs?.length || 0}`);
  console.log(`   Total Records: ${selectedParts.length + (vehicles?.length || 0) + (crossRefs?.length || 0)}`);
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

// Run the export
exportSeedSnapshot()
  .then(() => {
    console.log('\n✅ Export complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  });
