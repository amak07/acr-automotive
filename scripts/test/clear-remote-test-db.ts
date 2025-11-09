#!/usr/bin/env tsx

import { supabase } from '../../src/lib/supabase/client';

async function main() {
  console.log('🗑️  Clearing Remote Test DB...\n');

  // Check current counts
  console.log('📊 Current table counts:');
  const tables = ['parts', 'vehicle_applications', 'cross_references'];
  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`   ${table}: ${count} rows`);
  }

  // Delete all parts (CASCADE will handle VA and CR)
  console.log('\n🗑️  Deleting all data...');
  const { error } = await supabase
    .from('parts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  // Verify deletion
  console.log('\n📊 After deletion:');
  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`   ${table}: ${count} rows`);
  }

  console.log('\n✅ Remote Test DB cleared successfully!');
}

main();
