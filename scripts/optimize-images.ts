#!/usr/bin/env tsx
/**
 * Local Image Optimization Script
 *
 * Pre-optimizes images before bulk upload to bypass Vercel's 4.5MB limit.
 * Uses same Sharp settings as server for consistent output.
 *
 * Usage:
 *   npm run optimize-images <input-folder> [output-folder]
 *
 * Examples:
 *   npm run optimize-images ./IMAGENES-NFC
 *   npm run optimize-images ./IMAGENES-NFC ./IMAGENES-NFC-optimized
 */

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// Match server Sharp config exactly
const CONFIG = {
  maxDimension: 1600,
  jpegQuality: 85,
  progressive: true,
} as const;

interface OptimizeResult {
  originalSize: number;
  optimizedSize: number;
}

async function optimizeImage(
  inputPath: string,
  outputPath: string
): Promise<OptimizeResult> {
  const inputBuffer = await fs.readFile(inputPath);
  const originalSize = inputBuffer.length;

  const optimized = await sharp(inputBuffer)
    .resize(CONFIG.maxDimension, CONFIG.maxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: CONFIG.jpegQuality,
      progressive: CONFIG.progressive,
      mozjpeg: true,
    })
    .toBuffer();

  await fs.writeFile(outputPath, optimized);

  return { originalSize, optimizedSize: optimized.length };
}

async function main() {
  const [inputDir, outputDir] = process.argv.slice(2);

  if (!inputDir) {
    console.error(
      "Usage: npm run optimize-images <input-folder> [output-folder]"
    );
    console.error("");
    console.error("Examples:");
    console.error('  npm run optimize-images "./public/IMAGENES ACR NFC"');
    console.error(
      '  npm run optimize-images "./public/IMAGENES ACR NFC" "./optimized"'
    );
    process.exit(1);
  }

  const input = path.resolve(inputDir);
  const output = outputDir ? path.resolve(outputDir) : input;

  // Verify input directory exists
  try {
    const stat = await fs.stat(input);
    if (!stat.isDirectory()) {
      console.error(`Error: ${input} is not a directory`);
      process.exit(1);
    }
  } catch {
    console.error(`Error: Directory not found: ${input}`);
    process.exit(1);
  }

  // Create output directory if different from input
  if (output !== input) {
    await fs.mkdir(output, { recursive: true });
  }

  // Find all image files
  const files = await fs.readdir(input);
  const imageFiles = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

  if (imageFiles.length === 0) {
    console.log("\nNo image files found in the directory.");
    process.exit(0);
  }

  console.log(`\n🖼️  Optimizing ${imageFiles.length} images...`);
  console.log(`   Input:  ${input}`);
  console.log(`   Output: ${output}`);
  console.log("");

  let totalOriginal = 0;
  let totalOptimized = 0;
  let processed = 0;
  let failed = 0;

  for (const file of imageFiles) {
    const inputPath = path.join(input, file);
    const outputPath = path.join(output, file.replace(/\.[^.]+$/, ".jpg"));

    try {
      const { originalSize, optimizedSize } = await optimizeImage(
        inputPath,
        outputPath
      );
      totalOriginal += originalSize;
      totalOptimized += optimizedSize;
      processed++;

      const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(0);
      console.log(
        `  ✓ ${file}: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(optimizedSize / 1024 / 1024).toFixed(1)}MB (-${reduction}%)`
      );
    } catch (err) {
      failed++;
      console.error(
        `  ✗ ${file}: ${err instanceof Error ? err.message : "Failed"}`
      );
    }
  }

  console.log("");
  console.log("═".repeat(60));

  if (processed > 0) {
    const totalReduction = ((1 - totalOptimized / totalOriginal) * 100).toFixed(
      0
    );
    console.log(`✅ Done! ${processed}/${imageFiles.length} images optimized`);
    console.log(
      `   Total: ${(totalOriginal / 1024 / 1024).toFixed(1)}MB → ${(totalOptimized / 1024 / 1024).toFixed(1)}MB (-${totalReduction}%)`
    );
  }

  if (failed > 0) {
    console.log(`⚠️  ${failed} files failed to optimize`);
  }

  console.log(`   Output: ${output}`);
  console.log("");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
