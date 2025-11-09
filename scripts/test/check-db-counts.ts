#!/usr/bin/env tsx

import { supabase } from '../../src/lib/supabase/client';

async function main() {
  console.log('📊 Checking Remote Test DB counts...\n');

  const { count: partsCount } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true });

  const { count: vaCount } = await supabase
    .from('vehicle_applications')
    .select('*', { count: 'exact', head: true });

  const { count: crCount } = await supabase
    .from('cross_references')
    .select('*', { count: 'exact', head: true });

  console.log(`Parts: ${partsCount}`);
  console.log(`Vehicle Applications: ${vaCount}`);
  console.log(`Cross References: ${crCount}`);
  console.log(`\nTotal Records: ${(partsCount || 0) + (vaCount || 0) + (crCount || 0)}`);
}

main();
