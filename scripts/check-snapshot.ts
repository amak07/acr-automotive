import { supabase } from '../src/lib/supabase/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.test') });

async function checkSnapshot() {
  const { data, error } = await supabase
    .from('import_history')
    .select('snapshot_data, file_name, created_at')
    .eq('file_name', 'GOLDEN_BASELINE_877.xlsx')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📸 Golden Snapshot Analysis\n');
  console.log('Filename:', data.file_name);
  console.log('Created:', data.created_at);
  console.log('\nSnapshot keys:', Object.keys(data.snapshot_data));
  console.log('\nData counts:');
  console.log('  parts:', data.snapshot_data.parts?.length || 0);
  console.log('  vehicle_applications:', data.snapshot_data.vehicle_applications?.length || 0);
  console.log('  vehicleApplications:', data.snapshot_data.vehicleApplications?.length || 0);
  console.log('  cross_references:', data.snapshot_data.cross_references?.length || 0);
  console.log('  crossReferences:', data.snapshot_data.crossReferences?.length || 0);
  console.log('\nTimestamp:', data.snapshot_data.timestamp);
}

checkSnapshot();
