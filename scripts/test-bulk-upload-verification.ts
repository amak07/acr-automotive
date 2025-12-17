/**
 * Bulk Upload Verification Script
 *
 * Compares expected image counts from source folders against actual
 * database records to verify bulk upload integrity.
 *
 * Usage: npx tsx scripts/test-bulk-upload-verification.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Local Supabase connection
const supabase = createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
);

// Source folders
const NFC_FOLDER = "public/IMAGENES ACR NFC";
const FOLDER_360 = "public/IMAGENES 360 ACR RENOMBRADAS";

interface ExpectedPart {
  extractedSku: string;
  numericSku: string | null;
  fileCount: number;
  filenames: string[];
  folder: "nfc" | "360";
}

interface ActualPart {
  partId: string;
  acrSku: string;
  imageCount: number;
}

interface VerificationResult {
  matched: {
    sku: string;
    expected: number;
    actual: number;
    status: "ok" | "mismatch";
  }[];
  unmatched: { sku: string; fileCount: number; folder: string }[];
  unexpected: { sku: string; imageCount: number }[];
  summary: {
    totalExpected: number;
    totalMatched: number;
    totalUnmatched: number;
    totalMismatch: number;
    totalUnexpected: number;
  };
}

/**
 * Extract numeric SKU from filename
 */
function extractNumericSku(filename: string): string | null {
  // Try to find 6+ digit number
  const match = filename.match(/(\d{6,})/);
  return match ? match[1] : null;
}

/**
 * Parse NFC folder files
 * Pattern: "ACR TM{SKU}.jpg" -> 1 image per SKU
 */
function parseNfcFolder(): Map<string, ExpectedPart> {
  const expected = new Map<string, ExpectedPart>();

  if (!fs.existsSync(NFC_FOLDER)) {
    console.log(`⚠️  NFC folder not found: ${NFC_FOLDER}`);
    return expected;
  }

  const files = fs.readdirSync(NFC_FOLDER);

  for (const file of files) {
    if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

    const numericSku = extractNumericSku(file);
    if (!numericSku) continue;

    // Use numeric SKU as key
    const existing = expected.get(numericSku);
    if (existing) {
      existing.fileCount++;
      existing.filenames.push(file);
    } else {
      expected.set(numericSku, {
        extractedSku: file.replace(/\.(jpg|jpeg|png|webp)$/i, ""),
        numericSku,
        fileCount: 1,
        filenames: [file],
        folder: "nfc",
      });
    }
  }

  return expected;
}

/**
 * Parse 360 folder files
 * Pattern: "ACR{SKU}_{view}.jpg" where view = fro|top|bot|oth
 */
function parse360Folder(): Map<string, ExpectedPart> {
  const expected = new Map<string, ExpectedPart>();

  if (!fs.existsSync(FOLDER_360)) {
    console.log(`⚠️  360 folder not found: ${FOLDER_360}`);
    return expected;
  }

  const files = fs.readdirSync(FOLDER_360);

  for (const file of files) {
    if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

    // Extract SKU from pattern: ACR{SKU}_{view}.jpg
    const match = file.match(/^(ACR\d+)_(bot|fro|oth|top)\.jpg$/i);
    if (!match) continue;

    const fullSku = match[1]; // e.g., "ACR2306032"
    const numericSku = fullSku.replace(/^ACR/i, ""); // e.g., "2306032"

    const existing = expected.get(numericSku);
    if (existing) {
      existing.fileCount++;
      existing.filenames.push(file);
    } else {
      expected.set(numericSku, {
        extractedSku: fullSku,
        numericSku,
        fileCount: 1,
        filenames: [file],
        folder: "360",
      });
    }
  }

  return expected;
}

/**
 * Get actual image counts from database
 */
async function getActualImageCounts(): Promise<Map<string, ActualPart>> {
  const actual = new Map<string, ActualPart>();

  // Query parts with their image counts
  const { data: parts, error } = await supabase
    .from("parts")
    .select(
      `
      id,
      acr_sku,
      part_images(id)
    `
    )
    .order("acr_sku");

  if (error) {
    console.error("Database query error:", error);
    return actual;
  }

  for (const part of parts || []) {
    // Extract numeric portion from ACR SKU (e.g., "ACR512122" -> "512122")
    const numericSku = part.acr_sku.replace(/^ACR/i, "");
    const imageCount = Array.isArray(part.part_images)
      ? part.part_images.length
      : 0;

    actual.set(numericSku, {
      partId: part.id,
      acrSku: part.acr_sku,
      imageCount,
    });
  }

  return actual;
}

/**
 * Compare expected vs actual and generate report
 */
function compareResults(
  expectedNfc: Map<string, ExpectedPart>,
  expected360: Map<string, ExpectedPart>,
  actual: Map<string, ActualPart>
): VerificationResult {
  const result: VerificationResult = {
    matched: [],
    unmatched: [],
    unexpected: [],
    summary: {
      totalExpected: 0,
      totalMatched: 0,
      totalUnmatched: 0,
      totalMismatch: 0,
      totalUnexpected: 0,
    },
  };

  // Combine expected from both folders (summing if same SKU appears in both)
  const combined = new Map<string, { expected: number; folder: string }>();

  for (const [sku, data] of expectedNfc) {
    combined.set(sku, { expected: data.fileCount, folder: "nfc" });
  }

  for (const [sku, data] of expected360) {
    const existing = combined.get(sku);
    if (existing) {
      existing.expected += data.fileCount;
      existing.folder = "both";
    } else {
      combined.set(sku, { expected: data.fileCount, folder: "360" });
    }
  }

  result.summary.totalExpected = combined.size;

  // Track which actual SKUs we've seen
  const seenActual = new Set<string>();

  // Compare each expected SKU
  for (const [sku, { expected, folder }] of combined) {
    const actualData = actual.get(sku);

    if (actualData) {
      seenActual.add(sku);
      const status = actualData.imageCount === expected ? "ok" : "mismatch";

      result.matched.push({
        sku: actualData.acrSku,
        expected,
        actual: actualData.imageCount,
        status,
      });

      if (status === "ok") {
        result.summary.totalMatched++;
      } else {
        result.summary.totalMismatch++;
      }
    } else {
      result.unmatched.push({
        sku,
        fileCount: expected,
        folder,
      });
      result.summary.totalUnmatched++;
    }
  }

  // Find parts with images that weren't in our expected list
  for (const [sku, data] of actual) {
    if (!seenActual.has(sku) && data.imageCount > 0) {
      result.unexpected.push({
        sku: data.acrSku,
        imageCount: data.imageCount,
      });
      result.summary.totalUnexpected++;
    }
  }

  return result;
}

/**
 * Print verification report
 */
function printReport(result: VerificationResult): void {
  console.log("\n" + "=".repeat(60));
  console.log("BULK UPLOAD VERIFICATION REPORT");
  console.log("=".repeat(60));

  // Summary
  console.log("\n📊 SUMMARY");
  console.log("-".repeat(40));
  console.log(`Total expected SKUs:     ${result.summary.totalExpected}`);
  console.log(
    `✅ Matched correctly:    ${result.summary.totalMatched} (${((result.summary.totalMatched / result.summary.totalExpected) * 100).toFixed(1)}%)`
  );
  console.log(`⚠️  Count mismatch:      ${result.summary.totalMismatch}`);
  console.log(`❌ Unmatched (no part):  ${result.summary.totalUnmatched}`);
  console.log(`❓ Unexpected (extra):   ${result.summary.totalUnexpected}`);

  // Mismatches (most important!)
  if (result.summary.totalMismatch > 0) {
    console.log("\n⚠️  COUNT MISMATCHES (expected ≠ actual)");
    console.log("-".repeat(40));
    const mismatches = result.matched.filter((m) => m.status === "mismatch");
    for (const m of mismatches.slice(0, 20)) {
      console.log(`  ${m.sku}: expected ${m.expected}, got ${m.actual}`);
    }
    if (mismatches.length > 20) {
      console.log(`  ... and ${mismatches.length - 20} more`);
    }
  }

  // Unmatched files (no matching part in DB)
  if (result.summary.totalUnmatched > 0) {
    console.log("\n❌ UNMATCHED SKUS (files exist but no part in database)");
    console.log("-".repeat(40));
    for (const u of result.unmatched.slice(0, 20)) {
      console.log(`  ${u.sku}: ${u.fileCount} files (${u.folder})`);
    }
    if (result.unmatched.length > 20) {
      console.log(`  ... and ${result.unmatched.length - 20} more`);
    }
  }

  // Unexpected parts with images
  if (result.summary.totalUnexpected > 0) {
    console.log("\n❓ UNEXPECTED PARTS WITH IMAGES");
    console.log("-".repeat(40));
    for (const u of result.unexpected.slice(0, 10)) {
      console.log(`  ${u.sku}: ${u.imageCount} images`);
    }
    if (result.unexpected.length > 10) {
      console.log(`  ... and ${result.unexpected.length - 10} more`);
    }
  }

  // Successfully matched (condensed)
  console.log("\n✅ SUCCESSFULLY MATCHED");
  console.log("-".repeat(40));
  const successCount = result.matched.filter((m) => m.status === "ok").length;
  console.log(`  ${successCount} parts have correct image counts`);

  // Sample of successful matches
  const successSample = result.matched
    .filter((m) => m.status === "ok")
    .slice(0, 5);
  if (successSample.length > 0) {
    console.log("  Sample:");
    for (const s of successSample) {
      console.log(`    ${s.sku}: ${s.actual} images`);
    }
  }

  console.log("\n" + "=".repeat(60));
}

/**
 * Main verification flow
 */
async function main() {
  console.log("🔍 Bulk Upload Verification Script");
  console.log("=".repeat(60));

  // Step 1: Parse source folders
  console.log("\n📁 Parsing source folders...");

  const expectedNfc = parseNfcFolder();
  console.log(`  NFC folder: ${expectedNfc.size} unique SKUs`);

  const expected360 = parse360Folder();
  console.log(`  360 folder: ${expected360.size} unique SKUs`);

  // Step 2: Get actual database state
  console.log("\n📊 Querying database...");
  const actual = await getActualImageCounts();
  const partsWithImages = Array.from(actual.values()).filter(
    (p) => p.imageCount > 0
  ).length;
  console.log(`  Total parts: ${actual.size}`);
  console.log(`  Parts with images: ${partsWithImages}`);

  // Step 3: Compare and report
  const result = compareResults(expectedNfc, expected360, actual);
  printReport(result);

  // Exit with error code if there are issues
  if (result.summary.totalMismatch > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
