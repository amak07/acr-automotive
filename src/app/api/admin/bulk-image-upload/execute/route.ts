import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import sharp from "sharp";
import { TablesInsert } from "@/lib/supabase/types";
import { VALIDATION } from "@/lib/bulk-upload/patterns.config";
import type { ExecuteResult, PartUploadResult } from "@/lib/bulk-upload/types";

// =====================================================
// Configuration (matches 360-frames route)
// =====================================================

const CONFIG_360 = {
  targetDimension: 1200,
  jpegQuality: 85,
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
  viewType?: "front" | "top" | "bottom" | "other";
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
// Helper: Upload product image
// =====================================================

async function uploadProductImage(
  file: File,
  partId: string,
  displayOrder: number
): Promise<{ imageUrl: string; imageId: string } | null> {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    return null;
  }

  // Validate file size
  if (file.size > VALIDATION.maxProductImageSize) {
    return null;
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const fileExt = file.name.split(".").pop();
  const fileName = `${partId}_${timestamp}_${randomSuffix}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("acr-part-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[bulk-upload] Product image upload error:", uploadError);
    return null;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("acr-part-images").getPublicUrl(fileName);

  // Create database record
  const newImage: TablesInsert<"part_images"> = {
    part_id: partId,
    image_url: publicUrl,
    display_order: displayOrder,
    is_primary: false,
    caption: null,
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
    return null;
  }

  return {
    imageUrl: publicUrl,
    imageId: imageRecord.id,
  };
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
          // Delete existing product images first (replace mode)
          const { data: existingImages } = await supabase
            .from("part_images")
            .select("id, image_url")
            .eq("part_id", partId);

          if (existingImages && existingImages.length > 0) {
            // Extract storage paths from URLs and delete from storage
            const storagePaths = existingImages
              .map((img) => {
                // Extract filename from URL (last segment after bucket name)
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

            // Delete database records
            await supabase.from("part_images").delete().eq("part_id", partId);
          }

          // Sort by view type order
          const viewTypeOrder: Record<string, number> = {
            front: 0,
            top: 1,
            other: 2,
            bottom: 3,
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

          for (const imgInfo of imagesToUpload) {
            const file = fileMap.get(imgInfo.filename);
            if (!file) continue;

            const uploaded = await uploadProductImage(
              file,
              partId,
              displayOrder++
            );
            if (uploaded) {
              result.imagesUploaded++;
              totalImagesUploaded++;
            }
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
