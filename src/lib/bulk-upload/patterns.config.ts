/**
 * Bulk Image Upload Pattern Configuration
 *
 * This file contains all configurable patterns for file classification.
 * When a new supplier format needs to be supported, edit this file.
 *
 * ADDING NEW PATTERNS:
 * 1. For new 360° frame formats: Add regex to frame360 array
 * 2. For new product view keywords: Add to productViews object
 * 3. Patterns are tested in order - first match wins
 */

import type { ProductViewType } from "./types";

export const FILE_PATTERNS = {
  /**
   * 360° frame patterns (order matters - first match wins)
   * Each pattern should capture: (1) SKU portion, (2) frame number
   *
   * Current supported formats:
   * - CTK512016_01_001.jpg (CTK supplier format)
   * - SKU_360_001.jpg (alternative format)
   * - SKU_frame01.jpg (alternative format)
   */
  frame360: [
    /^(.+)_01_(\d{2,3})\.(jpg|jpeg|png|webp)$/i, // CTK: {PREFIX}{SKU}_01_{FRAME}.jpg
    /^(.+)_360_(\d{2,3})\.(jpg|jpeg|png|webp)$/i, // Alt: {SKU}_360_{FRAME}.jpg
    /^(.+)_frame[_-]?(\d{2,3})\.(jpg|jpeg|png|webp)$/i, // Alt: {SKU}_frame{FRAME}.jpg
  ] as RegExp[],

  /**
   * Product view keywords mapped to canonical types
   * Each keyword triggers classification as that view type
   *
   * Includes:
   * - English abbreviations (fro, bot, top, oth)
   * - Full English words (front, bottom, etc.)
   * - Spanish translations (frente, abajo, etc.)
   * - Common alternatives (main, side, angle, etc.)
   */
  productViews: {
    front: ["fro", "front", "frente", "f", "main", "principal", "hero"],
    top: ["top", "arriba", "t", "above", "superior"],
    other: [
      "oth", // Explicit suffix for "other angle" view
      "side",
      "lateral",
      "angle",
      "left",
      "right",
      "izquierda",
      "derecha",
    ],
    // Note: "other" and "otro" removed - too ambiguous with "generic" viewType
    bottom: ["bot", "bottom", "abajo", "b", "below", "inferior"],
  } as Record<ProductViewType, string[]>,

  /**
   * File extensions to skip entirely (videos, documents, etc.)
   */
  skipExtensions: /\.(mp4|mov|avi|webm|gif|pdf|doc|docx|txt|csv|xlsx)$/i,

  /**
   * Valid image extensions
   */
  imageExtensions: /\.(jpg|jpeg|png|webp)$/i,
};

/**
 * Display order for product views
 * Lower number = higher priority (shown first)
 */
export const VIEW_DISPLAY_ORDER: Record<ProductViewType, number> = {
  front: 0,
  top: 1,
  other: 2,
  bottom: 3,
  generic: 4, // Display last (no specific angle)
};

/**
 * Validation constants
 */
export const VALIDATION = {
  /** Maximum product images per part (5 viewTypes + room for manual uploads) */
  maxProductImages: 10,
  /** Maximum file size for product images (5MB) */
  maxProductImageSize: 5 * 1024 * 1024,
  /** Minimum 360° frames required */
  min360Frames: 12,
  /** Recommended 360° frames */
  recommended360Frames: 24,
  /** Maximum 360° frames allowed */
  max360Frames: 48,
  /** Maximum file size for 360° frames (10MB) */
  max360FrameSize: 10 * 1024 * 1024,
  /** SKU matching similarity threshold */
  skuMatchThreshold: 0.85,
  /** Batch size for analyze API requests (avoid URI too long errors) */
  analyzeBatchSize: 200,
};
