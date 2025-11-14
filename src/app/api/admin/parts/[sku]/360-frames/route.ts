import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import sharp from "sharp";
import { normalizeSku } from "@/lib/utils/sku-utils";

// =====================================================
// Configuration
// =====================================================

const CONFIG = {
  minFrames: 12,
  recommendedFrames: 24,
  maxFrames: 48,
  targetDimension: 1200,
  jpegQuality: 85,
  maxFileSize: 10 * 1024 * 1024, // 10MB per file
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

interface UploadedFrame {
  frame_number: number;
  image_url: string;
  file_size_bytes: number;
  width: number;
  height: number;
}

// =====================================================
// Helper: Optimize image with Sharp
// =====================================================

async function optimizeFrame(file: File): Promise<ProcessedImage> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const processed = await sharp(inputBuffer)
      .resize(CONFIG.targetDimension, CONFIG.targetDimension, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({
        quality: CONFIG.jpegQuality,
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
  } catch (error) {
    console.error("[360-frames] Image optimization error:", error);
    throw new Error(`Failed to optimize image: ${file.name}`);
  }
}

// =====================================================
// POST: Upload 360° frames
// =====================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;
    const normalizedSku = normalizeSku(sku);

    // Get part details by SKU
    const { data: part, error: partError } = await supabase
      .from("parts")
      .select("id, acr_sku")
      .eq("acr_sku", normalizedSku)
      .single();

    if (partError || !part) {
      console.error("[360-frames] Part not found:", normalizedSku, partError);
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const partId = part.id;

    const formData = await req.formData();
    const files: File[] = [];

    // Extract all uploaded files
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    console.log(
      `[360-frames] Received ${files.length} files for part ${part.acr_sku}`
    );

    // Validation: Minimum frame count
    if (files.length < CONFIG.minFrames) {
      return NextResponse.json(
        {
          error: `Minimum ${CONFIG.minFrames} frames required`,
          currentCount: files.length,
        },
        { status: 400 }
      );
    }

    // Validation: Maximum frame count
    if (files.length > CONFIG.maxFrames) {
      return NextResponse.json(
        {
          error: `Maximum ${CONFIG.maxFrames} frames allowed`,
          currentCount: files.length,
        },
        { status: 400 }
      );
    }

    // Validation: File sizes
    const oversizedFiles = files.filter(
      (file) => file.size > CONFIG.maxFileSize
    );
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        {
          error: `Files too large (max ${CONFIG.maxFileSize / 1024 / 1024}MB per file)`,
          oversizedFiles: oversizedFiles.map((f) => f.name),
        },
        { status: 400 }
      );
    }

    // Generate warning for suboptimal frame count
    let warning: string | null = null;
    if (files.length < CONFIG.recommendedFrames) {
      warning = `${CONFIG.recommendedFrames}+ frames recommended for smooth rotation`;
    } else if (files.length > CONFIG.maxFrames) {
      warning = `Consider using ${CONFIG.maxFrames} frames or fewer for optimal loading`;
    }

    console.log(
      `[360-frames] Validation passed. Processing ${files.length} frames...`
    );

    // Delete existing 360 frames
    const { data: existingFrames } = await supabase
      .from("part_360_frames")
      .select("storage_path")
      .eq("part_id", partId);

    if (existingFrames && existingFrames.length > 0) {
      console.log(
        `[360-frames] Deleting ${existingFrames.length} existing frames`
      );
      const paths = existingFrames.map((f) => f.storage_path);
      await supabase.storage.from("acr-part-images").remove(paths);
      await supabase.from("part_360_frames").delete().eq("part_id", partId);
    }

    // Process and upload frames
    const uploadedFrames: UploadedFrame[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(
        `[360-frames] Processing frame ${i + 1}/${files.length}: ${file.name}`
      );

      try {
        // Optimize image with Sharp
        const optimized = await optimizeFrame(file);
        console.log(
          `[360-frames] Optimized ${file.name}: ${file.size} → ${optimized.size} bytes (${Math.round((optimized.size / file.size) * 100)}%)`
        );

        // Storage path: 360-viewer/{acr_sku}/frame-000.jpg
        const storagePath = `360-viewer/${part.acr_sku}/frame-${i.toString().padStart(3, "0")}.jpg`;

        // Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from("acr-part-images")
          .upload(storagePath, optimized.buffer, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "3600",
          });

        if (uploadError) {
          console.error(
            `[360-frames] Upload error for frame ${i}:`,
            uploadError
          );
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("acr-part-images").getPublicUrl(storagePath);

        // Save to database
        const { error: dbError } = await supabase
          .from("part_360_frames")
          .insert({
            part_id: partId,
            frame_number: i,
            image_url: publicUrl,
            storage_path: storagePath,
            file_size_bytes: optimized.size,
            width: optimized.width,
            height: optimized.height,
          });

        if (dbError) {
          console.error(`[360-frames] Database error for frame ${i}:`, dbError);
          throw dbError;
        }

        uploadedFrames.push({
          frame_number: i,
          image_url: publicUrl,
          file_size_bytes: optimized.size,
          width: optimized.width,
          height: optimized.height,
        });

        console.log(`[360-frames] Frame ${i + 1} uploaded successfully`);
      } catch (error) {
        const errorMsg = `Frame ${i + 1} (${file.name}): ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(`[360-frames] ${errorMsg}`);
      }
    }

    // If any errors occurred, return partial success
    if (errors.length > 0 && uploadedFrames.length === 0) {
      return NextResponse.json(
        {
          error: "All frames failed to upload",
          details: errors,
        },
        { status: 500 }
      );
    }

    // Update part record
    const { error: updateError } = await supabase
      .from("parts")
      .update({
        has_360_viewer: uploadedFrames.length >= CONFIG.minFrames,
        viewer_360_frame_count: uploadedFrames.length,
      })
      .eq("id", partId);

    if (updateError) {
      console.error("[360-frames] Part update error:", updateError);
      // Don't fail the request if only the part update fails
    }

    console.log(
      `[360-frames] Upload complete: ${uploadedFrames.length}/${files.length} frames successful`
    );

    return NextResponse.json({
      success: true,
      frameCount: uploadedFrames.length,
      frames: uploadedFrames,
      warning,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[360-frames] Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload 360° frames",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET: Fetch 360° frames for a part
// =====================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;
    const normalizedSku = normalizeSku(sku);

    // Lookup part ID by SKU
    const { data: part, error: partError } = await supabase
      .from("parts")
      .select("id")
      .eq("acr_sku", normalizedSku)
      .single();

    if (partError || !part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const partId = part.id;

    const { data: frames, error } = await supabase
      .from("part_360_frames")
      .select("*")
      .eq("part_id", partId)
      .order("frame_number", { ascending: true });

    if (error) {
      console.error("[360-frames] Fetch error:", error);
      throw error;
    }

    console.log(
      `[360-frames] Fetched ${frames?.length || 0} frames for part ${partId}`
    );

    return NextResponse.json({
      frames: frames || [],
      count: frames?.length || 0,
    });
  } catch (error) {
    console.error("[360-frames] Fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch frames",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE: Remove 360° viewer for a part
// =====================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;
    const normalizedSku = normalizeSku(sku);

    // Lookup part ID by SKU
    const { data: part, error: partError } = await supabase
      .from("parts")
      .select("id")
      .eq("acr_sku", normalizedSku)
      .single();

    if (partError || !part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const partId = part.id;

    console.log(
      `[360-frames] Deleting 360° viewer for part ${partId} (SKU: ${normalizedSku})`
    );

    // Get all frames
    const { data: frames } = await supabase
      .from("part_360_frames")
      .select("storage_path")
      .eq("part_id", partId);

    if (frames && frames.length > 0) {
      console.log(`[360-frames] Deleting ${frames.length} frames from storage`);

      // Delete from storage
      const paths = frames.map((f) => f.storage_path);
      const { error: storageError } = await supabase.storage
        .from("acr-part-images")
        .remove(paths);

      if (storageError) {
        console.error("[360-frames] Storage deletion error:", storageError);
        // Continue even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("part_360_frames")
        .delete()
        .eq("part_id", partId);

      if (dbError) {
        console.error("[360-frames] Database deletion error:", dbError);
        throw dbError;
      }
    }

    // Update part record
    const { error: updateError } = await supabase
      .from("parts")
      .update({
        has_360_viewer: false,
        viewer_360_frame_count: 0,
      })
      .eq("id", partId);

    if (updateError) {
      console.error("[360-frames] Part update error:", updateError);
      throw updateError;
    }

    console.log(`[360-frames] 360° viewer deleted successfully`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[360-frames] Delete error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete viewer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
