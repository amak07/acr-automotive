import { supabase } from '../src/lib/supabase/client';

async function checkNewParts() {
  // Look for parts with SKU pattern ACR-2025-* (the new parts we added)
  const { data: newParts, error } = await supabase
    .from('parts')
    .select('acr_sku, part_type, created_at')
    .like('acr_sku', 'ACR-2025-%')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('\n🔍 New parts (ACR-2025-*):', newParts?.length || 0);
    if (newParts && newParts.length > 0) {
      console.log('\nSample:');
      newParts.forEach(p => {
        console.log(`  - ${p.acr_sku} (${p.part_type}) - Created: ${new Date(p.created_at).toLocaleString()}`);
      });
    }
  }

  // Check for recently updated parts
  const { data: updatedParts, error: updateError } = await supabase
    .from('parts')
    .select('acr_sku, specifications, updated_at')
    .like('specifications', '%Updated 2025-10-29%')
    .limit(5);

  if (!updateError && updatedParts) {
    console.log('\n📝 Recently updated parts:', updatedParts.length);
    updatedParts.forEach(p => {
      console.log(`  - ${p.acr_sku}: ${p.specifications?.substring(0, 60)}...`);
    });
  }
}

checkNewParts().catch(console.error);
