import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

const testSkus = ['ACR2302006', 'ACR2302007', 'ACR2303004', 'ACR2303012', 'ACR2303015', 'ACR2303016', 'CTK512016', 'ACR512016', 'ACR13592828'];

async function clearTestData() {
  console.log('Clearing test data for SKUs:', testSkus.join(', '));

  // Get parts by SKU
  const { data: parts, error: partsError } = await supabase
    .from('parts')
    .select('id, acr_sku')
    .in('acr_sku', testSkus);

  if (partsError) {
    console.error('Error fetching parts:', partsError);
    return;
  }

  if (parts === null || parts.length === 0) {
    console.log('No parts found for test SKUs');
    return;
  }

  console.log('Found', parts.length, 'parts to clear');

  const partIds = parts.map(p => p.id);

  // Get part_images
  const { data: images } = await supabase
    .from('part_images')
    .select('id, image_url')
    .in('part_id', partIds);

  if (images && images.length > 0) {
    console.log('Found', images.length, 'product images to delete');

    // Extract storage paths
    const storagePaths = images
      .map(img => {
        const match = img.image_url.match(/acr-part-images\/([^?]+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('acr-part-images')
        .remove(storagePaths);
      if (storageError) console.error('Storage delete error:', storageError);
      else console.log('Deleted', storagePaths.length, 'files from storage');
    }

    // Delete DB records
    const { error: imgError } = await supabase
      .from('part_images')
      .delete()
      .in('part_id', partIds);
    if (imgError) console.error('part_images delete error:', imgError);
    else console.log('Deleted part_images records');
  } else {
    console.log('No product images found');
  }

  // Get 360 frames
  const { data: frames } = await supabase
    .from('part_360_frames')
    .select('id, storage_path')
    .in('part_id', partIds);

  if (frames && frames.length > 0) {
    console.log('Found', frames.length, '360 frames to delete');

    const framePaths = frames.map(f => f.storage_path).filter(Boolean);

    if (framePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('acr-part-images')
        .remove(framePaths);
      if (storageError) console.error('Frame storage delete error:', storageError);
      else console.log('Deleted', framePaths.length, 'frame files from storage');
    }

    // Delete DB records
    const { error: frameError } = await supabase
      .from('part_360_frames')
      .delete()
      .in('part_id', partIds);
    if (frameError) console.error('part_360_frames delete error:', frameError);
    else console.log('Deleted part_360_frames records');
  } else {
    console.log('No 360 frames found');
  }

  // Reset parts
  const { error: updateError } = await supabase
    .from('parts')
    .update({ has_360_viewer: false, viewer_360_frame_count: 0 })
    .in('id', partIds);

  if (updateError) console.error('Parts update error:', updateError);
  else console.log('Reset has_360_viewer and viewer_360_frame_count for', partIds.length, 'parts');

  console.log('Done!');
}

clearTestData();