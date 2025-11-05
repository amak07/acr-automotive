import { supabase } from '../src/lib/supabase/client';

async function checkImport() {
  // Count total parts
  const { count: partsCount, error: partsError } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true });

  if (partsError) {
    console.error('Error counting parts:', partsError);
  } else {
    console.log('\n📊 Total parts in database:', partsCount);
  }

  // Get latest import
  const { data: imports, error: importError } = await supabase
    .from('import_history')
    .select('id, file_name, created_at, rows_imported, import_summary')
    .order('created_at', { ascending: false })
    .limit(1);

  if (importError) {
    console.error('Error fetching import history:', importError);
  } else if (imports && imports.length > 0) {
    const latest = imports[0];
    console.log('\n✅ Latest import:');
    console.log('   Import ID:', latest.id);
    console.log('   File:', latest.file_name);
    console.log('   Date:', new Date(latest.created_at).toLocaleString());
    console.log('   Changes:', latest.rows_imported);
    console.log('   Summary:', latest.import_summary);
  } else {
    console.log('\n⚠️  No imports found');
  }
}

checkImport().catch(console.error);
