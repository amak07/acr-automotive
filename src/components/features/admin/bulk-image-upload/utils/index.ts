/**
 * Bulk Image Upload Utilities
 *
 * NOTE: 360° frame uploads are now handled by a separate flow (Bulk360UploadModal)
 * This module focuses only on product image classification and upload.
 */

export {
  classifyFile,
  detectProductView,
  classifyAndGroupFiles,
  sortProductImagesByViewOrder,
} from "./file-classifier";

export {
  extractSkuFromFilename,
  extractFullSkuFromFilename,
} from "./sku-extractor";
