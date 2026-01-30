import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import sharp from "sharp";
import { TablesInsert } from "@/lib/supabase/types";
import { VALIDATION } from "@/lib/bulk-upload/patterns.config";
import { requireAuth } from "@/lib/api/auth-helpers";
import type { ExecuteResult, PartUploadResult } from "@/lib/bulk-upload/types";

// Vercel function configuration
// With Fluid Compute (default): Hobby=300s, Pro=800s
// Without Fluid Compute: Hobby=60s max, Pro=300s max
export const maxDuration = 60;

// =====================================================
// Configuration
// =====================================================

const CONFIG_360 = {
  targetDimension: 1200,
  jpegQuality: 85,
} as const;

const CONFIG_PRODUCT = {
  maxDimension: 1600, // Larger than 360° for product detail
  jpegQuality: 85, // Same quality as 360°
  maxInputSize: 10 * 1024 * 1024, // 10MB input limit (before compression)
} as const;

// =====================================================
// Types
// =====================================================

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}

interface UploadInstruction {
  partId: string;
  acrSku: string;
  filename: string;
  type: "product" | "360-frame";
  frameNumber?: number;
  viewType?: "front" | "top" | "bottom" | "other" | "generic";
}

// =====================================================
// Helper: Optimize 360° frame with Sharp
// =====================================================

async function optimize360Frame(file: File): Promise<ProcessedImage> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const processed = await sharp(inputBuffer)
    .resize(CONFIG_360.targetDimension, CONFIG_360.targetDimension, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .jpeg({
      quality: CONFIG_360.jpegQuality,
      progressive: true,
      mozjpeg: true,
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: processed.data,
    width: processed.info.width,
    height: processed.info.height,
    size: processed.info.size,
  };
}

// =====================================================
// Helper: Optimize product image with Sharp
// =====================================================

async function optimizeProductImage(file: File): Promise<ProcessedImage> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const processed = await sharp(inputBuffer)
    .resize(CONFIG_PRODUCT.maxDimension, CONFIG_PRODUCT.maxDimension, {
      fit: "inside", // Maintain aspect ratio, fit within bounds
      withoutEnlargement: true, // Don't upscale small images
    })
    .jpeg({
      quality: CONFIG_PRODUCT.jpegQuality,
      progressive: true,
      mozjpeg: true,
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: processed.data,
    width: processed.info.width,
    height: processed.info.height,
    size: processed.info.size,
  };
}

// =====================================================
// Helper: Upload product image (with Sharp optimization)
// =====================================================

type UploadProductResult =
  | { success: true; imageUrl: string; imageId: string }
  | { success: false; error: string };

async function uploadProductImage(
  file: File,
  partId: string,
  displayOrder: number,
  viewType?: string
): Promise<UploadProductResult> {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { success: false, error: `Invalid file type: ${file.type}` };
  }

  // Validate input file size (before compression)
  if (file.size > CONFIG_PRODUCT.maxInputSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return { success: false, error: `File too large: ${sizeMB}MB (max 10MB)` };
  }

  try {
    // Optimize image with Sharp (resizes and compresses)
    const optimized = await optimizeProductImage(file);

    // Generate unique filename (always .jpg after optimization)
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileName = `${partId}_${timestamp}_${randomSuffix}.jpg`;

    // Upload optimized buffer to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("acr-part-images")
      .upload(fileName, optimized.buffer, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[bulk-upload] Product image upload error:", uploadError);
      return { success: false, error: `Storage error: ${uploadError.message}` };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("acr-part-images").getPublicUrl(fileName);

    // Create database record (view_type will be available after migration)
    const newImage: TablesInsert<"part_images"> = {
      part_id: partId,
      image_url: publicUrl,
      display_order: displayOrder,
      is_primary: false,
      caption: null,
      ...(viewType && { view_type: viewType }),
    };

    const { data: imageRecord, error: dbError } = await supabase
      .from("part_images")
      .insert(newImage)
      .select("id")
      .single();

    if (dbError) {
      console.error("[bulk-upload] Product image DB error:", dbError);
      // Clean up uploaded file
      await supabase.storage.from("acr-part-images").remove([fileName]);
      return { success: false, error: `Database error: ${dbError.message}` };
    }

    return {
      success: true,
      imageUrl: publicUrl,
      imageId: imageRecord.id,
    };
  } catch (err) {
    console.error("[bulk-upload] Product image processing error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Image processing failed",
    };
  }
}

// =====================================================
// Helper: Upload 360° frames for a part
// =====================================================

async function upload360Frames(
  files: File[],
  partId: string,
  acrSku: string
): Promise<{ frameCount: number; errors: string[] }> {
  const errors: string[] = [];

  // Delete existing 360 frames
  const { data: existingFrames } = await supabase
    .from("part_360_frames")
    .select("storage_path")
    .eq("part_id", partId);

  if (existingFrames && existingFrames.length > 0) {
    const paths = existingFrames.map((f) => f.storage_path);
    await supabase.storage.from("acr-part-images").remove(paths);
    await supabase.from("part_360_frames").delete().eq("part_id", partId);
  }

  // Sort files by frame number (already extracted during classification)
  // We assume files are passed in order

  let uploadedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      // Optimize image with Sharp
      const optimized = await optimize360Frame(file);

      // Storage path: 360-viewer/{acr_sku}/frame-000.jpg
      const storagePath = `360-viewer/${acrSku}/frame-${i.toString().padStart(3, "0")}.jpg`;

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from("acr-part-images")
        .upload(storagePath, optimized.buffer, {
          contentType: "image/jpeg",
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("acr-part-images").getPublicUrl(storagePath);

      // Save to database
      const { error: dbError } = await supabase.from("part_360_frames").insert({
        part_id: partId,
        frame_number: i,
        image_url: publicUrl,
        storage_path: storagePath,
        file_size_bytes: optimized.size,
        width: optimized.width,
        height: optimized.height,
      });

      if (dbError) {
        throw dbError;
      }

      uploadedCount++;
    } catch (error) {
      errors.push(
        `Frame ${i + 1} (${file.name}): ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Update part record
  if (uploadedCount >= VALIDATION.min360Frames) {
    await supabase
      .from("parts")
      .update({
        has_360_viewer: true,
        viewer_360_frame_count: uploadedCount,
      })
      .eq("id", partId);
  }

  return { frameCount: uploadedCount, errors };
}

// =====================================================
// Helper: Recalculate display order for all images on a part
// =====================================================

/**
 * Recalculates display_order for ALL images on a part to ensure proper ordering.
 * Called after uploading new images to fix display_order collisions.
 *
 * Priority order: front → top → other → bottom → generic
 * Within same viewType: preserves creation order (created_at)
 */
async function recalculateDisplayOrder(partId: string): Promise<void> {
  const viewTypeOrder: Record<string, number> = {
    front: 0,
    top: 1,
    other: 2,
    bottom: 3,
    generic: 4,
  };

  // Get all images for this part
  const { data: images, error } = await supabase
    .from("part_images")
    .select("id, view_type, created_at")
    .eq("part_id", partId)
    .order("created_at", { ascending: true });

  if (error || !images || images.length === 0) return;

  // Sort by viewType priority, then by created_at for same viewType
  const sorted = [...images].sort((a, b) => {
    const orderA = a.view_type ? (viewTypeOrder[a.view_type] ?? 99) : 99;
    const orderB = b.view_type ? (viewTypeOrder[b.view_type] ?? 99) : 99;
    if (orderA !== orderB) return orderA - orderB;
    // Same viewType: preserve creation order
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Update display_order for each image
  for (let i = 0; i < sorted.length; i++) {
    await supabase
      .from("part_images")
      .update({ display_order: i })
      .eq("id", sorted[i].id);
  }
}

/**
 * POST /api/admin/bulk-image-upload/execute
 *
 * Executes the bulk upload based on analyzed mappings.
 *
 * Request: multipart/form-data with:
 * - files: The actual image files
 * - instructions: JSON string with upload instructions per file
 *
 * Response:
 * {
 *   success: boolean
 *   results: PartUploadResult[]
 *   summary: { totalParts, successfulParts, failedParts, totalImagesUploaded, total360FramesUploaded }
 * }
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await request.formData();

    // Parse instructions
    const instructionsJson = formData.get("instructions") as string;
    if (!instructionsJson) {
      return NextResponse.json(
        { error: "Missing upload instructions" },
        { status: 400 }
      );
    }

    const instructions: UploadInstruction[] = JSON.parse(instructionsJson);

    // Get all files from formData
    const fileMap = new Map<string, File>();
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.startsWith("file_")) {
        fileMap.set(value.name, value);
      }
    }

    // Group instructions by part
    const instructionsByPart = new Map<
      string,
      {
        partId: string;
        acrSku: string;
        productImages: { filename: string; viewType?: string }[];
        frames360: { filename: string; frameNumber?: number }[];
      }
    >();

    for (const inst of instructions) {
      let partData = instructionsByPart.get(inst.partId);
      if (!partData) {
        partData = {
          partId: inst.partId,
          acrSku: inst.acrSku,
          productImages: [],
          frames360: [],
        };
        instructionsByPart.set(inst.partId, partData);
      }

      if (inst.type === "product") {
        partData.productImages.push({
          filename: inst.filename,
          viewType: inst.viewType,
        });
      } else if (inst.type === "360-frame") {
        partData.frames360.push({
          filename: inst.filename,
          frameNumber: inst.frameNumber,
        });
      }
    }

    // Process each part
    const results: PartUploadResult[] = [];
    let totalImagesUploaded = 0;
    let total360FramesUploaded = 0;

    for (const [partId, partData] of instructionsByPart) {
      const result: PartUploadResult = {
        partId,
        acrSku: partData.acrSku,
        success: true,
        imagesUploaded: 0,
        frames360Uploaded: 0,
      };

      try {
        // Upload product images
        if (partData.productImages.length > 0) {
          // Get unique viewTypes being uploaded
          const incomingViewTypes = new Set(
            partData.productImages
              .map((img) => img.viewType)
              .filter((vt): vt is string => vt !== undefined)
          );

          // Delete ONLY existing images that match incoming viewTypes (replace-by-viewType)
          // This preserves images with different viewTypes (e.g., uploading "front" keeps "generic")
          if (incomingViewTypes.size > 0) {
            const { data: existingImages } = await supabase
              .from("part_images")
              .select("id, image_url, view_type")
              .eq("part_id", partId);

            if (existingImages && existingImages.length > 0) {
              // Filter to images matching incoming viewTypes
              const imagesToDelete = existingImages.filter(
                (img) => img.view_type && incomingViewTypes.has(img.view_type)
              );

              if (imagesToDelete.length > 0) {
                // Extract storage paths from URLs and delete from storage
                const storagePaths = imagesToDelete
                  .map((img) => {
                    const url = img.image_url;
                    const match = url.match(/acr-part-images\/([^?]+)/);
                    return match ? match[1] : null;
                  })
                  .filter((path): path is string => path !== null);

                if (storagePaths.length > 0) {
                  await supabase.storage
                    .from("acr-part-images")
                    .remove(storagePaths);
                }

                // Delete database records for matching viewTypes only
                await supabase
                  .from("part_images")
                  .delete()
                  .in(
                    "id",
                    imagesToDelete.map((img) => img.id)
                  );
              }
            }
          }

          // Sort by view type order
          const viewTypeOrder: Record<string, number> = {
            front: 0,
            top: 1,
            other: 2,
            bottom: 3,
            generic: 4,
          };

          partData.productImages.sort((a, b) => {
            const orderA = a.viewType ? (viewTypeOrder[a.viewType] ?? 99) : 99;
            const orderB = b.viewType ? (viewTypeOrder[b.viewType] ?? 99) : 99;
            return orderA - orderB;
          });

          // Upload images up to limit
          const imagesToUpload = partData.productImages.slice(
            0,
            VALIDATION.maxProductImages
          );
          let displayOrder = 0;
          const imageErrors: string[] = [];

          for (const imgInfo of imagesToUpload) {
            const file = fileMap.get(imgInfo.filename);
            if (!file) continue;

            const uploaded = await uploadProductImage(
              file,
              partId,
              displayOrder++,
              imgInfo.viewType
            );
            if (uploaded.success === true) {
              result.imagesUploaded++;
              totalImagesUploaded++;
            } else {
              imageErrors.push(`${imgInfo.filename}: ${uploaded.error}`);
            }
          }

          // Add image errors to result
          if (imageErrors.length > 0) {
            result.error = imageErrors.join("; ");
          }
        }

        // Upload 360° frames
        if (partData.frames360.length > 0) {
          // Sort by frame number
          partData.frames360.sort(
            (a, b) => (a.frameNumber || 0) - (b.frameNumber || 0)
          );

          // Collect files in order
          const frameFiles: File[] = [];
          for (const frameInfo of partData.frames360) {
            const file = fileMap.get(frameInfo.filename);
            if (file) {
              frameFiles.push(file);
            }
          }

          if (frameFiles.length >= VALIDATION.min360Frames) {
            const frameResult = await upload360Frames(
              frameFiles,
              partId,
              partData.acrSku
            );
            result.frames360Uploaded = frameResult.frameCount;
            total360FramesUploaded += frameResult.frameCount;

            if (frameResult.errors.length > 0) {
              result.error = `Some frames failed: ${frameResult.errors.join("; ")}`;
            }
          } else if (frameFiles.length > 0) {
            result.error = `Only ${frameFiles.length} 360° frames provided (minimum ${VALIDATION.min360Frames} required)`;
          }
        }
      } catch (error) {
        result.success = false;
        result.error = error instanceof Error ? error.message : "Unknown error";
      }

      // Recalculate display order for all images on this part
      // This fixes display_order collisions when uploading multiple batches
      if (result.imagesUploaded > 0) {
        await recalculateDisplayOrder(partId);
      }

      // Mark success if we uploaded anything
      result.success =
        result.imagesUploaded > 0 || result.frames360Uploaded > 0;

      results.push(result);
    }

    // Build summary
    const summary = {
      totalParts: results.length,
      successfulParts: results.filter((r) => r.success).length,
      failedParts: results.filter((r) => !r.success).length,
      totalImagesUploaded,
      total360FramesUploaded,
    };

    const response: ExecuteResult = {
      success: summary.failedParts === 0,
      results,
      summary,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[bulk-upload] Execute error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute bulk upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
