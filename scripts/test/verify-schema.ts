import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load test environment
dotenv.config({ path: path.join(process.cwd(), '.env.test') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('🔍 Verifying test database schema...\n');

  // Check import_history table
  const { data, error } = await supabase
    .from('import_history')
    .select('count')
    .limit(1);

  if (error) {
    console.log('❌ import_history table: NOT FOUND');
    console.log('   Error:', error.message);
    console.log('\n💡 Did you run migration 006?');
    process.exit(1);
  }

  console.log('✅ import_history table: EXISTS');

  // Check updated_at columns
  const { data: parts, error: partsError } = await supabase
    .from('parts')
    .select('updated_at, updated_by')
    .limit(1);

  if (partsError || !parts || parts.length === 0) {
    console.log('❌ parts.updated_at column: NOT FOUND');
    console.log('   Error:', partsError?.message || 'No data');
    console.log('\n💡 Did you run migration 007?');
    process.exit(1);
  }

  console.log('✅ parts.updated_at column: EXISTS');
  console.log('\n✅ All schema checks passed!');
}

verifySchema();