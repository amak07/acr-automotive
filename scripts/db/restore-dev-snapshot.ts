#!/usr/bin/env tsx
/**
 * Restore Development Database Snapshot
 *
 * Restores the development database from a previously saved snapshot.
 * Creates the snapshot using save-dev-snapshot.ts
 *
 * Usage: npm run db:restore-snapshot
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SNAPSHOT_DIR = path.join(process.cwd(), '.snapshots');
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'dev-snapshot.json');

async function main() {
  console.log('🔄 Restoring development database from snapshot...\n');

  // Check if snapshot exists
  if (!fs.existsSync(SNAPSHOT_FILE)) {
    console.error('❌ No snapshot found!');
    console.log('💡 Create a snapshot first: npm run db:save-snapshot');
    process.exit(1);
  }

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
    // Read snapshot
    console.log('📖 Reading snapshot file...');
    const snapshotData = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));

    console.log(`📅 Snapshot created: ${snapshotData.created_at}`);
    console.log(`📊 Contents:`);
    console.log(`   Parts: ${snapshotData.parts.length}`);
    console.log(`   Vehicle Applications: ${snapshotData.vehicle_applications.length}`);
    console.log(`   Cross References: ${snapshotData.cross_references.length}`);

    // Delete current data (in reverse FK order)
    console.log('\n🗑️  Clearing current data...');
    await supabase.from('cross_references').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vehicle_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('parts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Also clear import_history (except test snapshots if any)
    await supabase.from('import_history').delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .neq('file_name', '__TEST_DEV_SNAPSHOT__');

    // Restore data (in FK order)
    console.log('📥 Restoring parts...');
    if (snapshotData.parts.length > 0) {
      const { error } = await supabase.from('parts').insert(snapshotData.parts);
      if (error) throw new Error(`Failed to restore parts: ${error.message}`);
    }

    console.log('📥 Restoring vehicle applications...');
    if (snapshotData.vehicle_applications.length > 0) {
      const { error } = await supabase.from('vehicle_applications').insert(snapshotData.vehicle_applications);
      if (error) throw new Error(`Failed to restore vehicle_applications: ${error.message}`);
    }

    console.log('📥 Restoring cross references...');
    if (snapshotData.cross_references.length > 0) {
      const { error } = await supabase.from('cross_references').insert(snapshotData.cross_references);
      if (error) throw new Error(`Failed to restore cross_references: ${error.message}`);
    }

    console.log('\n✅ Database restored successfully!');
    console.log(`\n📊 Restored:`);
    console.log(`   Parts: ${snapshotData.parts.length}`);
    console.log(`   Vehicle Applications: ${snapshotData.vehicle_applications.length}`);
    console.log(`   Cross References: ${snapshotData.cross_references.length}`);

  } catch (error) {
    console.error('❌ Failed to restore snapshot:', error);
    process.exit(1);
  }
}

main();
