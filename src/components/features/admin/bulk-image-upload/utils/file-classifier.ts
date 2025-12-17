/**
 * File Classification Utilities
 *
 * Classifies uploaded files as 360° frames, product images, or skip.
 * Uses configurable patterns from patterns.config.ts
 */

import {
  FILE_PATTERNS,
  VIEW_DISPLAY_ORDER,
} from "@/lib/bulk-upload/patterns.config";
import type { ClassifiedFile, ProductViewType } from "@/lib/bulk-upload/types";
import { extractSkuFromFilename } from "./sku-extractor";

/**
 * Classify a file based on its filename
 *
 * Classification order:
 * 1. Check if should be skipped (videos, etc.)
 * 2. Check if valid image extension
 * 3. Try to match 360° frame patterns
 * 4. Try to detect product view keywords
 * 5. Mark as "unknown" if valid image but unrecognized pattern
 */
export function classifyFile(file: File): ClassifiedFile {
  const filename = file.name;

  // Check if should skip (video, document, etc.)
  if (FILE_PATTERNS.skipExtensions.test(filename)) {
    return {
      file,
      filename,
      type: "skip",
      extractedSku: null,
    };
  }

  // Check if valid image extension
  if (!FILE_PATTERNS.imageExtensions.test(filename)) {
    return {
      file,
      filename,
      type: "skip",
      extractedSku: null,
    };
  }

  // Try 360° frame patterns (order matters - first match wins)
  for (const pattern of FILE_PATTERNS.frame360) {
    const match = filename.match(pattern);
    if (match) {
      return {
        file,
        filename,
        type: "360-frame",
        extractedSku: extractSkuFromFilename(filename),
        frameNumber: parseInt(match[2], 10),
      };
    }
  }

  // Try product view patterns
  const viewType = detectProductView(filename);
  if (viewType) {
    return {
      file,
      filename,
      type: "product",
      extractedSku: extractSkuFromFilename(filename),
      viewType,
    };
  }

  // Valid image with extractable SKU but no recognized view pattern
  // Upload as product image with "generic" view type (displays last, distinct from "_oth" angle)
  const extractedSku = extractSkuFromFilename(filename);
  if (extractedSku) {
    return {
      file,
      filename,
      type: "product",
      extractedSku,
      viewType: "generic",
    };
  }

  // No SKU extracted - mark as unknown for manual review
  return {
    file,
    filename,
    type: "unknown",
    extractedSku: null,
  };
}

/**
 * Detect product view type from filename keywords
 *
 * Searches for keywords anywhere in the filename (case-insensitive)
 * Returns the first matching view type, or null if no match
 */
export function detectProductView(filename: string): ProductViewType | null {
  const base = filename
    .replace(FILE_PATTERNS.imageExtensions, "")
    .toLowerCase();

  // Check each view type's keywords
  for (const [viewType, keywords] of Object.entries(
    FILE_PATTERNS.productViews
  )) {
    // Use word boundary matching for short keywords to avoid false positives
    for (const keyword of keywords) {
      // For single-character keywords, require underscore or space before
      if (keyword.length === 1) {
        const pattern = new RegExp(
          `[_\\s]${keyword}$|[_\\s]${keyword}[_\\s.]`,
          "i"
        );
        if (pattern.test(base)) {
          return viewType as ProductViewType;
        }
      } else {
        // For longer keywords, just check if included
        if (base.includes(keyword)) {
          return viewType as ProductViewType;
        }
      }
    }
  }

  return null;
}

/**
 * Classify multiple files and group by SKU
 *
 * @returns Map of SKU → ClassifiedFile[]
 */
export function classifyAndGroupFiles(files: File[]): {
  bysku: Map<string, ClassifiedFile[]>;
  noSku: ClassifiedFile[];
  skipped: ClassifiedFile[];
} {
  const bysku = new Map<string, ClassifiedFile[]>();
  const noSku: ClassifiedFile[] = [];
  const skipped: ClassifiedFile[] = [];

  for (const file of files) {
    const classified = classifyFile(file);

    if (classified.type === "skip") {
      skipped.push(classified);
      continue;
    }

    if (!classified.extractedSku) {
      noSku.push(classified);
      continue;
    }

    const existing = bysku.get(classified.extractedSku) || [];
    existing.push(classified);
    bysku.set(classified.extractedSku, existing);
  }

  return { bysku, noSku, skipped };
}

/**
 * Sort product images by view type display order
 */
export function sortProductImagesByViewOrder(
  files: ClassifiedFile[]
): ClassifiedFile[] {
  return [...files].sort((a, b) => {
    const orderA = a.viewType ? VIEW_DISPLAY_ORDER[a.viewType] : 999;
    const orderB = b.viewType ? VIEW_DISPLAY_ORDER[b.viewType] : 999;
    return orderA - orderB;
  });
}

/**
 * Sort 360° frames by frame number
 */
export function sort360FramesByNumber(
  files: ClassifiedFile[]
): ClassifiedFile[] {
  return [...files].sort((a, b) => {
    return (a.frameNumber || 0) - (b.frameNumber || 0);
  });
}

/**
 * Renumber 360° frames sequentially (0-indexed, no gaps)
 * Used to normalize frames before upload
 */
export function renumber360Frames(files: ClassifiedFile[]): ClassifiedFile[] {
  const sorted = sort360FramesByNumber(files);
  return sorted.map((file, index) => ({
    ...file,
    frameNumber: index + 1, // 1-indexed for display
  }));
}
