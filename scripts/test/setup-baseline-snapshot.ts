/**
 * Setup Golden Baseline Snapshot
 *
 * Creates a reusable snapshot from baseline-export.xlsx (877 parts).
 * This snapshot is used by all tests for fast, consistent database resets.
 *
 * The golden snapshot is:
 * - Created once and reused across all test runs
 * - Tagged with description: "GOLDEN_BASELINE_877"
 * - Never deleted (persists across test runs)
 * - Can be recreated if corrupted
 *
 * Usage:
 *   npm run test:setup-baseline
 */

import { ImportService } from '../../src/services/excel/import/ImportService';
import { ExcelImportService } from '../../src/services/excel/import/ExcelImportService';
import { ValidationEngine } from '../../src/services/excel/validation/ValidationEngine';
import { DiffEngine } from '../../src/services/excel/diff/DiffEngine';
import { supabase } from '../../src/lib/supabase/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: path.join(process.cwd(), '.env.test') });

const BASELINE_FILE = path.join(process.cwd(), 'tmp', 'baseline-export.xlsx');
const GOLDEN_SNAPSHOT_FILENAME = 'GOLDEN_BASELINE_877.xlsx'; // Use unique filename to identify golden snapshot
const TEST_PROJECT_ID = 'fzsdaqpwwbuwkvbzyiax';

export async function setupBaselineSnapshot() {
  console.log('\n📸 GOLDEN BASELINE SNAPSHOT SETUP\n');
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
    // Step 1: Check if golden snapshot already exists
    console.log('Step 1: Checking for existing golden snapshot...');
    const { data: existing, error: checkError } = await supabase
      .from('import_history')
      .select('id, created_at, snapshot_data')
      .eq('file_name', GOLDEN_SNAPSHOT_FILENAME)
      .single();

    if (existing && !checkError) {
      console.log('✅ Golden snapshot already exists!');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Created: ${new Date(existing.created_at).toLocaleString()}`);

      const snapshotData = existing.snapshot_data as any;
      console.log(`   Parts: ${snapshotData.parts?.length || 0}`);
      console.log(`   Vehicle Applications: ${snapshotData.vehicleApplications?.length || 0}`);
      console.log(`   Cross References: ${snapshotData.crossReferences?.length || 0}`);
      console.log('\n💡 To recreate, delete this snapshot first and run again.\n');
      return existing.id;
    }

    console.log('⚠️  No golden snapshot found - will create new one\n');

    // Step 2: Clear database
    console.log('Step 2: Clearing database...');
    await supabase.from('part_360_frames').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('part_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cross_references').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vehicle_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('parts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('import_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Database cleared\n');

    // Step 3: Load baseline Excel file
    console.log('Step 3: Loading baseline-export.xlsx...');
    if (!fs.existsSync(BASELINE_FILE)) {
      throw new Error(`Baseline file not found: ${BASELINE_FILE}`);
    }

    const fileBuffer = fs.readFileSync(BASELINE_FILE);
    const file = new File([fileBuffer], 'baseline-export.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    console.log(`✅ File loaded (${(fileBuffer.length / 1024).toFixed(2)} KB)\n`);

    // Step 4: Parse Excel
    console.log('Step 4: Parsing Excel file...');
    const excelService = new ExcelImportService();
    const parsed = await excelService.parseFile(file);
    console.log(`✅ Parsed:`);
    console.log(`   Parts: ${parsed.parts.rowCount}`);
    console.log(`   Vehicle Applications: ${parsed.vehicleApplications.rowCount}`);
    console.log(`   Cross References: ${parsed.crossReferences.rowCount}\n`);

    // Step 5: Skip validation for baseline (we're creating from scratch with pre-assigned UUIDs)
    console.log('Step 5: Skipping validation (baseline creation)...');
    console.log('✅ Baseline data will be inserted with original UUIDs preserved\n');

    // Step 6: Generate diff (all adds since DB is empty)
    console.log('Step 6: Generating diff...');
    const diffEngine = new DiffEngine();
    const emptyDbState = {
      parts: new Map(),
      vehicleApplications: new Map(),
      crossReferences: new Map(),
      partSkus: new Set<string>(),
    };
    const diff = diffEngine.generateDiff(parsed, emptyDbState);
    console.log(`✅ Diff generated:`);
    console.log(`   Adds: ${diff.summary.totalAdds}`);
    console.log(`   Updates: ${diff.summary.totalUpdates}`);
    console.log(`   Deletes: ${diff.summary.totalDeletes}\n`);

    // Step 7: Execute import (WITHOUT creating snapshot - we'll create it after)
    console.log('Step 7: Executing import directly (no snapshot needed yet)...');
    const importService = new ImportService();

    // Execute bulk operations directly without going through executeImport
    // (which would create a pre-import snapshot we don't need)
    await (importService as any).executeBulkOperations(diff, undefined);

    console.log('✅ Import completed!')
    console.log(`   Changes Applied: ${diff.summary.totalChanges}\n`);

    // Step 8: Create POST-import snapshot (capture the data we just imported)
    console.log('Step 8: Creating golden snapshot (POST-import state)...');

    // Fetch all current data
    const [partsResult, vehicleAppsResult, crossRefsResult] = await Promise.all([
      supabase.from('parts').select('*'),
      supabase.from('vehicle_applications').select('*'),
      supabase.from('cross_references').select('*'),
    ]);

    if (partsResult.error) throw partsResult.error;
    if (vehicleAppsResult.error) throw vehicleAppsResult.error;
    if (crossRefsResult.error) throw crossRefsResult.error;

    const snapshotData = {
      parts: partsResult.data || [],
      vehicle_applications: vehicleAppsResult.data || [],
      cross_references: crossRefsResult.data || [],
      timestamp: new Date().toISOString(),
    };

    console.log('   Captured data:');
    console.log(`   Parts: ${snapshotData.parts.length}`);
    console.log(`   Vehicle Applications: ${snapshotData.vehicle_applications.length}`);
    console.log(`   Cross References: ${snapshotData.cross_references.length}\n`);

    // Save snapshot to import_history
    const { data: historyRecords, error: saveError } = await supabase
      .from('import_history')
      .insert({
        tenant_id: null,
        imported_by: 'test-system',
        file_name: GOLDEN_SNAPSHOT_FILENAME,
        file_size_bytes: fileBuffer.length,
        rows_imported: diff.summary.totalChanges,
        snapshot_data: snapshotData,
        import_summary: {
          adds: diff.summary.totalAdds,
          updates: diff.summary.totalUpdates,
          deletes: diff.summary.totalDeletes,
        },
      })
      .select();

    if (saveError || !historyRecords || historyRecords.length === 0) {
      throw new Error(`Failed to save golden snapshot: ${saveError?.message || 'No record returned'}`);
    }

    const goldenSnapshotId = historyRecords[0].id;

    console.log('✅ Golden snapshot verified:');
    console.log(`   ID: ${goldenSnapshotId}`);
    console.log(`   Filename: ${GOLDEN_SNAPSHOT_FILENAME}`);
    console.log(`   Parts: ${snapshotData.parts.length}`);
    console.log(`   Vehicle Applications: ${snapshotData.vehicle_applications.length}`);
    console.log(`   Cross References: ${snapshotData.cross_references.length}\n`);

    console.log('═'.repeat(80));
    console.log('🎉 GOLDEN BASELINE SNAPSHOT CREATED!\n');
    console.log('This snapshot will be used by all tests for fast database resets.');
    console.log(`Snapshot ID: ${goldenSnapshotId}`);
    console.log('');

    return goldenSnapshotId;

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for use in other scripts
export async function getOrCreateGoldenSnapshot(): Promise<string> {
  // Check if snapshot exists
  const { data: existing } = await supabase
    .from('import_history')
    .select('id')
    .eq('file_name', GOLDEN_SNAPSHOT_FILENAME)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create if doesn't exist
  return await setupBaselineSnapshot();
}

// Run if called directly
if (require.main === module) {
  setupBaselineSnapshot();
}
