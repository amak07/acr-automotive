import { supabase } from '../src/lib/supabase/client';

async function verifyBaseline() {
  console.log('🔍 Verifying database state after rollbacks...\n');

  // Get total counts
  const { data: parts, error: partsError } = await supabase
    .from('parts')
    .select('acr_sku, part_number, updated_by')
    .order('acr_sku');

  const { count: vehicleApps } = await supabase
    .from('vehicle_applications')
    .select('*', { count: 'exact', head: true });

  const { count: crossRefs } = await supabase
    .from('cross_references')
    .select('*', { count: 'exact', head: true });

  const { data: imports } = await supabase
    .from('import_history')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('📊 Current Database State:');
  console.log(`  Parts: ${parts?.length || 0}`);
  console.log(`  Vehicle Applications: ${vehicleApps || 0}`);
  console.log(`  Cross References: ${crossRefs || 0}`);
  console.log(`\n📜 Import History: ${imports?.length || 0} snapshots`);

  if (imports && imports.length > 0) {
    console.log('\n⚠️  Remaining snapshots:');
    imports.forEach((imp) => {
      console.log(`  - ${imp.file_name} (${new Date(imp.created_at).toLocaleString()})`);
    });
  } else {
    console.log('  ✅ All snapshots have been rolled back');
  }

  // Check if any parts have updated_by='import'
  const { data: importedParts } = await supabase
    .from('parts')
    .select('acr_sku, updated_by')
    .eq('updated_by', 'import');

  console.log(`\n🔎 Parts with updated_by='import': ${importedParts?.length || 0}`);

  if (importedParts && importedParts.length > 0) {
    console.log('  ⚠️  WARNING: Some parts still marked as imported!');
    console.log('  Sample:', importedParts.slice(0, 3).map(p => p.acr_sku).join(', '));
  } else {
    console.log('  ✅ No parts marked as imported (database is clean)');
  }

  // Sample a few parts to verify
  console.log('\n📦 Sample Parts (first 5):');
  parts?.slice(0, 5).forEach(p => {
    console.log(`  ${p.acr_sku}: ${p.part_number} (updated_by: ${p.updated_by || 'null'})`);
  });

  console.log('\n✅ Verification complete!');
  console.log('\nExpected baseline state:');
  console.log('  - 877 parts (original baseline-export.xlsx)');
  console.log('  - 0 import history snapshots');
  console.log('  - All parts should have updated_by="system" or null');
}

verifyBaseline().catch(console.error);
