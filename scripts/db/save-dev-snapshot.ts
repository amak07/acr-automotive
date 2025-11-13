#!/usr/bin/env tsx
/**
 * Save Development Database Snapshot
 *
 * Creates a snapshot of the current development database state.
 * This snapshot can be restored using restore-dev-snapshot.ts
 *
 * Usage: npm run db:save-snapshot
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SNAPSHOT_DIR = path.join(process.cwd(), '.snapshots');
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'dev-snapshot.json');

async function main() {
  console.log('💾 Saving development database snapshot...\n');

  // Connect to local Supabase (development)
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  try {
    // Fetch all data from tables
    console.log('📥 Fetching parts...');
    const { data: parts, error: partsError } = await supabase
      .from('parts')
      .select('*')
      .order('created_at');

    if (partsError) throw new Error(`Failed to fetch parts: ${partsError.message}`);

    console.log('📥 Fetching vehicle applications...');
    const { data: vehicleApplications, error: vehicleError } = await supabase
      .from('vehicle_applications')
      .select('*')
      .order('created_at');

    if (vehicleError) throw new Error(`Failed to fetch vehicle_applications: ${vehicleError.message}`);

    console.log('📥 Fetching cross references...');
    const { data: crossReferences, error: crossRefError } = await supabase
      .from('cross_references')
      .select('*')
      .order('created_at');

    if (crossRefError) throw new Error(`Failed to fetch cross_references: ${crossRefError.message}`);

    // Create snapshot object
    const snapshot = {
      created_at: new Date().toISOString(),
      parts: parts || [],
      vehicle_applications: vehicleApplications || [],
      cross_references: crossReferences || [],
    };

    // Ensure snapshot directory exists
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }

    // Save to file
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));

    console.log('\n✅ Snapshot saved successfully!');
    console.log(`📁 Location: ${SNAPSHOT_FILE}`);
    console.log(`\n📊 Snapshot contents:`);
    console.log(`   Parts: ${snapshot.parts.length}`);
    console.log(`   Vehicle Applications: ${snapshot.vehicle_applications.length}`);
    console.log(`   Cross References: ${snapshot.cross_references.length}`);
    console.log(`\n💡 To restore: npm run db:restore-snapshot`);

  } catch (error) {
    console.error('❌ Failed to save snapshot:', error);
    process.exit(1);
  }
}

main();
