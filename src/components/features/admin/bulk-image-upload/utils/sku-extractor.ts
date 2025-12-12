/**
 * SKU Extraction Utilities
 *
 * Extracts SKU numbers from supplier filenames.
 * Uses multiple strategies to handle various naming conventions.
 */

import { FILE_PATTERNS } from "@/lib/bulk-upload/patterns.config";

/**
 * Extract the numeric SKU portion from a filename
 *
 * Strategies (in order):
 * 1. Find 5-8 digit number (most SKUs are numeric)
 * 2. Extract alphanumeric portion before separator and strip letter prefix
 *
 * @example
 * "CTK512016_01_001.jpg" → "512016"
 * "CTK512016_fro.jpg" → "512016"
 * "512016_front.jpg" → "512016"
 * "ACR512016.jpg" → "512016"
 */
export function extractSkuFromFilename(filename: string): string | null {
  // Remove extension
  const base = filename.replace(FILE_PATTERNS.imageExtensions, "");

  // Strategy 1: Find 5-8 digit numeric sequence
  // This handles most cases where SKU is purely numeric
  const numericMatch = base.match(/(\d{5,8})/);
  if (numericMatch) {
    return numericMatch[1];
  }

  // Strategy 2: Extract first alphanumeric segment and strip letters
  // Handles cases like "BRAND123456_view.jpg"
  const segments = base.split(/[_\s-]+/);
  if (segments.length > 0) {
    const firstSegment = segments[0];
    // Strip leading letters (supplier prefix) and trailing letters
    const strippedMatch = firstSegment.match(/[A-Z]*(\d+)/i);
    if (strippedMatch && strippedMatch[1].length >= 4) {
      return strippedMatch[1];
    }
  }

  // Strategy 3: Last resort - any 4+ digit sequence
  const anyNumeric = base.match(/(\d{4,})/);
  if (anyNumeric) {
    return anyNumeric[1];
  }

  return null;
}

/**
 * Extract SKU with the full prefix intact (for display purposes)
 *
 * @example
 * "CTK512016_01_001.jpg" → "CTK512016"
 */
export function extractFullSkuFromFilename(filename: string): string | null {
  const base = filename.replace(FILE_PATTERNS.imageExtensions, "");

  // Get first segment (before any underscore, space, or dash)
  const segments = base.split(/[_\s-]+/);
  if (segments.length > 0) {
    return segments[0];
  }

  return null;
}
