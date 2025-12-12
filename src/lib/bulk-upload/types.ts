/**
 * Bulk Image Upload Types
 *
 * Type definitions for the bulk image upload feature that allows
 * uploading folders of supplier photos and automatically mapping
 * them to ACR parts via SKU detection.
 */

/** Canonical product view types */
export type ProductViewType = "front" | "top" | "bottom" | "other";

/** File classification result */
export interface ClassifiedFile {
  /** Original File object */
  file: File;
  /** Original filename */
  filename: string;
  /** Classification type */
  type: "product" | "360-frame" | "skip" | "unknown";
  /** Extracted SKU from filename (numeric portion) */
  extractedSku: string | null;
  /** Frame number for 360° frames (1-48) */
  frameNumber?: number;
  /** View type for product images */
  viewType?: ProductViewType;
}

/** Part matched to uploaded files */
export interface MatchedPart {
  /** Part UUID */
  partId: string;
  /** ACR SKU (e.g., "ACR512016") */
  acrSku: string;
  /** Part type description */
  partType: string;
  /** Current number of product images (0-6) */
  currentImageCount: number;
  /** Current number of 360° frames (0 or 12-48) */
  current360FrameCount: number;
  /** Product image files to upload */
  productImages: ClassifiedFile[];
  /** 360° frame files to upload */
  frames360: ClassifiedFile[];
  /** True if part has no existing images (first-time upload) */
  isNew: boolean;
  /** Warnings for this part (e.g., "Will exceed 6 image limit") */
  warnings: string[];
}

/** Result from the analyze API */
export interface AnalyzeResult {
  /** Parts successfully matched to files */
  matchedParts: MatchedPart[];
  /** Files where SKU could not be matched to any part */
  unmatchedFiles: ClassifiedFile[];
  /** Files that were skipped (videos, invalid formats) */
  skippedFiles: string[];
  /** Summary statistics */
  summary: {
    /** Total files in upload */
    totalFiles: number;
    /** Files successfully matched to parts */
    matchedFiles: number;
    /** Parts that already have images (updating) */
    partsToUpdate: number;
    /** Parts getting images for first time (new) */
    partsNew: number;
  };
}

/** Result from the execute API */
export interface ExecuteResult {
  /** Overall success status */
  success: boolean;
  /** Per-part upload results */
  results: PartUploadResult[];
  /** Summary statistics */
  summary: {
    /** Total parts processed */
    totalParts: number;
    /** Parts successfully uploaded */
    successfulParts: number;
    /** Parts with errors */
    failedParts: number;
    /** Total images uploaded */
    totalImagesUploaded: number;
    /** Total 360° frames uploaded */
    total360FramesUploaded: number;
  };
}

/** Upload result for a single part */
export interface PartUploadResult {
  /** Part UUID */
  partId: string;
  /** ACR SKU */
  acrSku: string;
  /** Whether upload succeeded */
  success: boolean;
  /** Number of product images uploaded */
  imagesUploaded: number;
  /** Number of 360° frames uploaded */
  frames360Uploaded: number;
  /** Error message if failed */
  error?: string;
}

/** Part with image statistics (from extended parts API) */
export interface PartWithImageStats {
  id: string;
  acr_sku: string;
  part_type: string;
  position_type: string | null;
  abs_type: string | null;
  bolt_pattern: string | null;
  drive_type: string | null;
  /** Count of product images */
  image_count: number;
  /** URL of primary (first) image */
  primary_image_url: string | null;
  /** Whether part has 360° viewer */
  has_360_viewer: boolean;
  /** Number of 360° frames */
  viewer_360_frame_count: number | null;
}
