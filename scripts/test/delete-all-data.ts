/**
 * Delete All Data from Staging Database
 *
 * WARNING: This will delete all data without restoring.
 * Use this to clean the staging environment.
 *
 * Usage:
 *   npm run staging:clear (uses .env.staging)
 *
 * Requires NODE_ENV=staging to be set by npm script
 */

import { supabase } from '../../src/lib/supabase/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load staging environment
if (process.env.NODE_ENV === ("staging" as string)) {
  dotenv.config({ path: path.join(process.cwd(), '.env.staging'), override: true });
} else {
  console.error("❌ ERROR: This script must be run with NODE_ENV=staging");
  console.error("   Use: npm run staging:clear");
  process.exit(1);
}

async function deleteAllData() {
  console.log('\n⚠️  DELETE ALL DATA - VERIFICATION MODE\n');
  console.log('═'.repeat(80));

  // Show which database we're connecting to
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const nodeEnv = process.env.NODE_ENV;

  console.log('🔍 Environment Check:');
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log('═'.repeat(80));

  // Safety check - verify we're using the TEST Supabase project
  const TEST_PROJECT_ID = 'fzsdaqpwwbuwkvbzyiax'; // acr-automotive-test project

  if (!supabaseUrl?.includes(TEST_PROJECT_ID)) {
    console.error('\n❌ SAFETY CHECK FAILED!');
    console.error('   This is NOT the test database project!');
    console.error(`   Current URL: ${supabaseUrl}`);
    console.error(`   Expected project ID: ${TEST_PROJECT_ID}`);
    console.error('\n   Aborting to prevent production data loss!\n');
    process.exit(1);
  }

  console.log(`   ✅ Safety check passed: Using TEST project (${TEST_PROJECT_ID})`);
  console.log('');

  try {
    // Get counts BEFORE deletion
    console.log('\n📊 BEFORE Deletion:');
    const { count: partsBefore } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true });

    const { count: vehiclesBefore } = await supabase
      .from('vehicle_applications')
      .select('*', { count: 'exact', head: true });

    const { count: crossRefsBefore } = await supabase
      .from('cross_references')
      .select('*', { count: 'exact', head: true });

    const { count: historyBefore } = await supabase
      .from('import_history')
      .select('*', { count: 'exact', head: true });

    const { count: imagesBefore } = await supabase
      .from('part_images')
      .select('*', { count: 'exact', head: true });

    const { count: frames360Before } = await supabase
      .from('part_360_frames')
      .select('*', { count: 'exact', head: true });

    console.log(`   Parts: ${partsBefore}`);
    console.log(`   Vehicle Applications: ${vehiclesBefore}`);
    console.log(`   Cross References: ${crossRefsBefore}`);
    console.log(`   Import History: ${historyBefore}`);
    console.log(`   Part Images: ${imagesBefore}`);
    console.log(`   Part 360 Frames: ${frames360Before}`);

    // Delete all data
    console.log('\n🗑️  Deleting all data...\n');

    console.log('   Deleting part_360_frames...');
    const { error: frames360Error } = await supabase
      .from('part_360_frames')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (frames360Error) {
      console.error(`   ❌ Error: ${frames360Error.message}`);
    } else {
      console.log('   ✅ Part 360 frames deleted');
    }

    console.log('   Deleting part_images...');
    const { error: imagesError } = await supabase
      .from('part_images')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (imagesError) {
      console.error(`   ❌ Error: ${imagesError.message}`);
    } else {
      console.log('   ✅ Part images deleted');
    }

    console.log('   Deleting cross_references...');
    const { error: crError } = await supabase
      .from('cross_references')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (crError) {
      console.error(`   ❌ Error: ${crError.message}`);
    } else {
      console.log('   ✅ Cross references deleted');
    }

    console.log('   Deleting vehicle_applications...');
    const { error: vaError } = await supabase
      .from('vehicle_applications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (vaError) {
      console.error(`   ❌ Error: ${vaError.message}`);
    } else {
      console.log('   ✅ Vehicle applications deleted');
    }

    console.log('   Deleting parts...');
    const { error: partsError } = await supabase
      .from('parts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (partsError) {
      console.error(`   ❌ Error: ${partsError.message}`);
    } else {
      console.log('   ✅ Parts deleted');
    }

    console.log('   Deleting import_history...');
    const { error: historyError } = await supabase
      .from('import_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (historyError) {
      console.error(`   ❌ Error: ${historyError.message}`);
    } else {
      console.log('   ✅ Import history deleted');
    }

    // Get counts AFTER deletion
    console.log('\n📊 AFTER Deletion:');
    const { count: partsAfter } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true });

    const { count: vehiclesAfter } = await supabase
      .from('vehicle_applications')
      .select('*', { count: 'exact', head: true });

    const { count: crossRefsAfter } = await supabase
      .from('cross_references')
      .select('*', { count: 'exact', head: true });

    const { count: historyAfter } = await supabase
      .from('import_history')
      .select('*', { count: 'exact', head: true });

    const { count: imagesAfter } = await supabase
      .from('part_images')
      .select('*', { count: 'exact', head: true });

    const { count: frames360After } = await supabase
      .from('part_360_frames')
      .select('*', { count: 'exact', head: true });

    console.log(`   Parts: ${partsAfter} (deleted: ${partsBefore! - partsAfter!})`);
    console.log(`   Vehicle Applications: ${vehiclesAfter} (deleted: ${vehiclesBefore! - vehiclesAfter!})`);
    console.log(`   Cross References: ${crossRefsAfter} (deleted: ${crossRefsBefore! - crossRefsAfter!})`);
    console.log(`   Import History: ${historyAfter} (deleted: ${historyBefore! - historyAfter!})`);
    console.log(`   Part Images: ${imagesAfter} (deleted: ${imagesBefore! - imagesAfter!})`);
    console.log(`   Part 360 Frames: ${frames360After} (deleted: ${frames360Before! - frames360After!})`);

    console.log('\n✅ ALL DATA DELETED\n');
    console.log('═'.repeat(80));
    console.log('🔍 Verification:');
    console.log(`   Database URL: ${supabaseUrl}`);
    console.log('   Check your Supabase dashboard to confirm this is the TEST database');
    console.log('   Data has been deleted but NOT restored');
    console.log('\n   To restore: npm run test:reset-db');
    console.log('═'.repeat(80));
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Deletion failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

deleteAllData();
