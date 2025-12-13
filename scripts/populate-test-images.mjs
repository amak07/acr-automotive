/**
 * Populate Test Images Script
 *
 * Dev-only script to populate ALL parts with sample images from the CTK512016 reference folder.
 * This helps test the UI/UX without manually uploading images one by one.
 *
 * Usage:
 *   node scripts/populate-test-images.mjs              # Process all parts
 *   node scripts/populate-test-images.mjs --limit 10  # Process only first 10 parts
 *   node scripts/populate-test-images.mjs --product-only  # Only product images (skip 360)
 *   node scripts/populate-test-images.mjs --360-only      # Only 360 frames (skip product)
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase client (local dev)
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

// Config
const SAMPLE_FOLDER = path.join(__dirname, '..', 'public', 'CTK512016');
const CONCURRENCY = 3;

// Parse command line args
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;
const productOnly = args.includes('--product-only');
const only360 = args.includes('--360-only');

// View type order for product images
const VIEW_ORDER = { front: 0, top: 1, other: 2, bottom: 3 };

async function main() {
  console.log('=== Populate Test Images ===\n');

  // Check sample folder exists
  if (!fs.existsSync(SAMPLE_FOLDER)) {
    console.error(`Sample folder not found: ${SAMPLE_FOLDER}`);
    process.exit(1);
  }

  // Read sample files
  const allFiles = fs.readdirSync(SAMPLE_FOLDER);
  const productFiles = allFiles.filter(f =>
    f.match(/_(fro|top|bot|oth)\.jpg$/i)
  ).sort((a, b) => {
    // Sort by view type order
    const getOrder = (f) => {
      if (f.includes('_fro')) return VIEW_ORDER.front;
      if (f.includes('_top')) return VIEW_ORDER.top;
      if (f.includes('_bot')) return VIEW_ORDER.bottom;
      if (f.includes('_oth')) return VIEW_ORDER.other;
      return 99;
    };
    return getOrder(a) - getOrder(b);
  });

  const frameFiles = allFiles.filter(f =>
    f.match(/_01_\d{3}\.jpg$/i)
  ).sort();

  console.log(`Sample folder: ${SAMPLE_FOLDER}`);
  console.log(`Product images: ${productFiles.length} files`);
  console.log(`360° frames: ${frameFiles.length} files`);
  console.log(`Mode: ${productOnly ? 'Product only' : only360 ? '360 only' : 'Both'}`);
  console.log('');

  // Query all parts
  let query = supabase
    .from('parts')
    .select('id, acr_sku')
    .order('acr_sku', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: parts, error: partsError } = await query;

  if (partsError) {
    console.error('Error fetching parts:', partsError);
    process.exit(1);
  }

  console.log(`Found ${parts.length} parts to process\n`);

  // Process parts in batches
  let completed = 0;
  let productUploaded = 0;
  let framesUploaded = 0;
  let errors = [];

  for (let i = 0; i < parts.length; i += CONCURRENCY) {
    const batch = parts.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (part) => {
      try {
        // Upload product images
        if (!only360 && productFiles.length > 0) {
          const imgCount = await uploadProductImages(part, productFiles);
          productUploaded += imgCount;
        }

        // Upload 360 frames
        if (!productOnly && frameFiles.length > 0) {
          const frameCount = await upload360Frames(part, frameFiles);
          framesUploaded += frameCount;
        }

        completed++;
        const pct = Math.round((completed / parts.length) * 100);
        process.stdout.write(`\r[${pct}%] Processed ${completed}/${parts.length} parts...`);
      } catch (err) {
        errors.push({ sku: part.acr_sku, error: err.message });
      }
    }));
  }

  console.log('\n\n=== Complete ===');
  console.log(`Parts processed: ${completed}`);
  console.log(`Product images uploaded: ${productUploaded}`);
  console.log(`360° frames uploaded: ${framesUploaded}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach(e => console.log(`  - ${e.sku}: ${e.error}`));
  }
}

async function uploadProductImages(part, productFiles) {
  const partId = part.id;

  // Delete existing images first
  const { data: existing } = await supabase
    .from('part_images')
    .select('id, image_url')
    .eq('part_id', partId);

  if (existing && existing.length > 0) {
    // Delete from storage
    const paths = existing
      .map(img => {
        const match = img.image_url.match(/acr-part-images\/([^?]+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (paths.length > 0) {
      await supabase.storage.from('acr-part-images').remove(paths);
    }

    // Delete DB records
    await supabase.from('part_images').delete().eq('part_id', partId);
  }

  // Upload new images
  let uploadCount = 0;
  for (let i = 0; i < productFiles.length; i++) {
    const filename = productFiles[i];
    const filePath = path.join(SAMPLE_FOLDER, filename);
    const fileBuffer = fs.readFileSync(filePath);

    // Generate unique storage path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const storagePath = `${partId}_${timestamp}_${randomSuffix}.jpg`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('acr-part-images')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error(`\nUpload error for ${part.acr_sku}: ${uploadError.message}`);
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('acr-part-images')
      .getPublicUrl(storagePath);

    // Insert DB record
    await supabase.from('part_images').insert({
      part_id: partId,
      image_url: urlData.publicUrl,
      display_order: i,
    });

    uploadCount++;
  }

  return uploadCount;
}

async function upload360Frames(part, frameFiles) {
  const partId = part.id;
  const acrSku = part.acr_sku;

  // Delete existing frames first
  const { data: existing } = await supabase
    .from('part_360_frames')
    .select('id, storage_path')
    .eq('part_id', partId);

  if (existing && existing.length > 0) {
    const paths = existing.map(f => f.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from('acr-part-images').remove(paths);
    }
    await supabase.from('part_360_frames').delete().eq('part_id', partId);
  }

  // Upload new frames with Sharp optimization
  let uploadCount = 0;
  for (let i = 0; i < frameFiles.length; i++) {
    const filename = frameFiles[i];
    const filePath = path.join(SAMPLE_FOLDER, filename);
    const fileBuffer = fs.readFileSync(filePath);

    // Optimize with Sharp
    const optimized = await sharp(fileBuffer)
      .resize(1200, 1200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    // Deterministic storage path
    const storagePath = `360-viewer/${acrSku}/frame-${i.toString().padStart(3, '0')}.jpg`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('acr-part-images')
      .upload(storagePath, optimized, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error(`\nFrame upload error for ${acrSku}: ${uploadError.message}`);
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('acr-part-images')
      .getPublicUrl(storagePath);

    // Insert DB record
    await supabase.from('part_360_frames').insert({
      part_id: partId,
      frame_number: i,
      image_url: urlData.publicUrl,
      storage_path: storagePath,
      file_size_bytes: optimized.length,
      width: 1200,
      height: 1200,
    });

    uploadCount++;
  }

  // Update part record
  await supabase
    .from('parts')
    .update({
      has_360_viewer: true,
      viewer_360_frame_count: uploadCount,
    })
    .eq('id', partId);

  return uploadCount;
}

main().catch(console.error);
