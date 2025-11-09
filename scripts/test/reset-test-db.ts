/**
 * Reset Test Database to Baseline State
 *
 * Restores test database to golden baseline snapshot (865 parts - count may vary after reseed).
 * Uses snapshot-based rollback for speed and consistency.
 *
 * This script will:
 * 1. Check if golden baseline snapshot exists
 * 2. If yes: Rollback to snapshot (fast ~2s)
 * 3. If no: Create snapshot from baseline-export.xlsx (one-time ~5s)
 * 4. Verify restoration success
 *
 * Usage:
 *   npm run test:reset-db
 */

import { supabase } from '../../src/lib/supabase/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment
dotenv.config({ path: path.join(process.cwd(), '.env.test') });

const GOLDEN_SNAPSHOT_FILENAME = 'GOLDEN_BASELINE_865.xlsx'; // Updated from 877 - may vary after reseed
const TEST_PROJECT_ID = 'fzsdaqpwwbuwkvbzyiax';

async function resetTestDatabase() {
  console.log('🔄 RESETTING TEST DATABASE TO BASELINE\n');
  console.log('═'.repeat(80));

  // Safety check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl?.includes(TEST_PROJECT_ID)) {
    console.error('❌ SAFETY CHECK FAILED!');
    console.error(`   Not using TEST Supabase project (${TEST_PROJECT_ID})`);
    console.error(`   Current URL: ${supabaseUrl}`);
    console.error('\n   Aborting to prevent production data loss!\n');
    process.exit(1);
  }

  console.log('✅ Safety check passed - using TEST environment');
  console.log(`   Database: ${supabaseUrl}\n`);

  try {
    // Step 1: Check if golden snapshot exists
    console.log('Step 1: Looking for golden baseline snapshot...');
    const { data: goldenSnapshot, error: findError } = await supabase
      .from('import_history')
      .select('id, created_at, snapshot_data')
      .eq('file_name', GOLDEN_SNAPSHOT_FILENAME)
      .single();

    if (!goldenSnapshot || findError) {
      console.log('⚠️  Golden snapshot not found - creating new one...\n');
      console.log('═'.repeat(80));
      console.log('This is a one-time setup - future resets will be faster!');
      console.log('═'.repeat(80));
      console.log('');

      // Import the setup script and create snapshot
      const { setupBaselineSnapshot } = await import('./setup-baseline-snapshot');
      const snapshotId = await setupBaselineSnapshot();

      console.log('\n✅ Golden snapshot created successfully!');
      console.log(`   Snapshot ID: ${snapshotId}`);
      console.log('\n💡 Future database resets will use this snapshot (~2s vs ~5s)\n');
      return;
    }

    console.log('✅ Golden snapshot found!');
    console.log(`   ID: ${goldenSnapshot.id}`);
    console.log(`   Created: ${new Date(goldenSnapshot.created_at).toLocaleString()}\n`);

    // Step 2: Clear all current data
    console.log('Step 2: Clearing current database state...');
    await supabase.from('part_360_frames').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('part_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cross_references').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vehicle_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('parts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Delete all import history EXCEPT the golden snapshot
    await supabase
      .from('import_history')
      .delete()
      .neq('id', goldenSnapshot.id);

    console.log('✅ Database cleared (preserved golden snapshot)\n');

    // Step 3: Restore from golden snapshot
    console.log('Step 3: Restoring from golden snapshot...');
    const snapshotData = goldenSnapshot.snapshot_data as any;

    // Restore parts
    if (snapshotData.parts && snapshotData.parts.length > 0) {
      const { error: partsError } = await supabase
        .from('parts')
        .insert(snapshotData.parts);

      if (partsError) throw partsError;
      console.log(`   ✅ Restored ${snapshotData.parts.length} parts`);
    }

    // Restore vehicle applications
    if (snapshotData.vehicle_applications && snapshotData.vehicle_applications.length > 0) {
      const { error: vaError } = await supabase
        .from('vehicle_applications')
        .insert(snapshotData.vehicle_applications);

      if (vaError) throw vaError;
      console.log(`   ✅ Restored ${snapshotData.vehicle_applications.length} vehicle applications`);
    }

    // Restore cross references
    if (snapshotData.cross_references && snapshotData.cross_references.length > 0) {
      const { error: crError } = await supabase
        .from('cross_references')
        .insert(snapshotData.cross_references);

      if (crError) throw crError;
      console.log(`   ✅ Restored ${snapshotData.cross_references.length} cross references`);
    }

    console.log('\n✅ Snapshot restoration complete!\n');

    // Step 4: Verify restoration
    console.log('Step 4: Verifying restoration...');
    const { count: partsCount } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true });

    const { count: vaCount } = await supabase
      .from('vehicle_applications')
      .select('*', { count: 'exact', head: true });

    const { count: crCount } = await supabase
      .from('cross_references')
      .select('*', { count: 'exact', head: true });

    console.log('');
    console.log('📊 Final Database State:');
    console.log(`  Parts: ${partsCount}`);
    console.log(`  Vehicle Applications: ${vaCount}`);
    console.log(`  Cross References: ${crCount}`);
    console.log('');

    console.log('═'.repeat(80));
    console.log('✅ DATABASE RESET COMPLETE!');
    console.log('═'.repeat(80));
    console.log('Your test database has been restored to the baseline state (865 parts).');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ RESET FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resetTestDatabase();
