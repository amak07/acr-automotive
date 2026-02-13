import { NextRequest, NextResponse } from "next/server";
import { supabase, createAdminClient } from "@/lib/supabase/client";
import sharp from "sharp";
import { normalizeSku } from "@/lib/utils/sku";
import { requireAuth } from "@/lib/api/auth-helpers";

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
  // Require authentication
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  // Use admin client for storage/DB writes (route is already auth-gated)
  const adminClient = createAdminClient();

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

    // Extract all uploaded files (validate MIME type server-side)
    const nonImageFiles: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (!value.type.startsWith("image/")) {
          nonImageFiles.push(value.name);
        } else {
          files.push(value);
        }
      }
    }

    if (nonImageFiles.length > 0) {
      return NextResponse.json(
        {
          error: "Only image files are allowed",
          invalidFiles: nonImageFiles,
        },
        { status: 400 }
      );
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
    }

    console.log(
      `[360-frames] Validation passed. Processing ${files.length} frames...`
    );

    // Fetch existing frames (needed for cleanup after successful upload)
    const { data: existingFrames } = await adminClient
      .from("part_360_frames")
      .select("storage_path, frame_number")
      .eq("part_id", partId);

    // Step 1: Upload all new frames to storage FIRST (upsert overwrites in place)
    // If any frame fails, we abort without touching DB records.
    const uploadedFrames: (UploadedFrame & { storage_path: string })[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(
        `[360-frames] Processing frame ${i + 1}/${files.length}: ${file.name}`
      );

      try {
        const optimized = await optimizeFrame(file);
        console.log(
          `[360-frames] Optimized ${file.name}: ${file.size} → ${optimized.size} bytes (${Math.round((optimized.size / file.size) * 100)}%)`
        );

        const storagePath = `360-viewer/${part.acr_sku}/frame-${i.toString().padStart(3, "0")}.jpg`;

        const { error: uploadError } = await adminClient.storage
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

        const {
          data: { publicUrl },
        } = adminClient.storage.from("acr-part-images").getPublicUrl(storagePath);

        uploadedFrames.push({
          frame_number: i,
          image_url: publicUrl,
          storage_path: storagePath,
          file_size_bytes: optimized.size,
          width: optimized.width,
          height: optimized.height,
        });

        console.log(`[360-frames] Frame ${i + 1} uploaded successfully`);
      } catch (error) {
        const errorMsg = `Frame ${i + 1} (${file.name}): ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(`[360-frames] ${errorMsg}`);
        // Abort: don't touch DB, existing viewer stays intact
        return NextResponse.json(
          {
            error: `Upload failed at frame ${i + 1}. Existing viewer preserved.`,
            details: errorMsg,
          },
          { status: 500 }
        );
      }
    }

    // Step 2: All frames uploaded successfully — now swap DB records
    console.log(
      `[360-frames] All ${uploadedFrames.length} frames uploaded. Swapping DB records...`
    );

    // Delete old DB records
    if (existingFrames && existingFrames.length > 0) {
      await adminClient.from("part_360_frames").delete().eq("part_id", partId);
    }

    // Insert new DB records
    const { error: insertError } = await adminClient
      .from("part_360_frames")
      .insert(
        uploadedFrames.map((f) => ({
          part_id: partId,
          frame_number: f.frame_number,
          image_url: f.image_url,
          storage_path: f.storage_path,
          file_size_bytes: f.file_size_bytes,
          width: f.width,
          height: f.height,
        }))
      );

    if (insertError) {
      console.error("[360-frames] Bulk insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to save frame records",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Step 3: Clean up excess old storage files (e.g., replacing 24 frames with 12)
    if (existingFrames && existingFrames.length > uploadedFrames.length) {
      const excessPaths = existingFrames
        .filter((f) => f.frame_number >= uploadedFrames.length)
        .map((f) => f.storage_path);
      if (excessPaths.length > 0) {
        console.log(
          `[360-frames] Cleaning up ${excessPaths.length} excess old storage files`
        );
        await adminClient.storage.from("acr-part-images").remove(excessPaths);
      }
    }

    // Step 4: Update part record
    const { error: updateError } = await adminClient
      .from("parts")
      .update({
        has_360_viewer: uploadedFrames.length >= CONFIG.minFrames,
        viewer_360_frame_count: uploadedFrames.length,
      })
      .eq("id", partId);

    if (updateError) {
      console.error("[360-frames] Part update error:", updateError);
    }

    console.log(
      `[360-frames] Upload complete: ${uploadedFrames.length}/${files.length} frames successful`
    );

    return NextResponse.json({
      success: true,
      frameCount: uploadedFrames.length,
      frames: uploadedFrames.map(({ storage_path, ...frame }) => frame),
      warning,
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
  // Require authentication
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

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
  // Require authentication
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  // Use admin client for storage/DB writes (route is already auth-gated)
  const adminClient = createAdminClient();

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
    const { data: frames } = await adminClient
      .from("part_360_frames")
      .select("storage_path")
      .eq("part_id", partId);

    if (frames && frames.length > 0) {
      console.log(`[360-frames] Deleting ${frames.length} frames from storage`);

      // Delete from storage
      const paths = frames.map((f) => f.storage_path);
      const { error: storageError } = await adminClient.storage
        .from("acr-part-images")
        .remove(paths);

      if (storageError) {
        console.error("[360-frames] Storage deletion error:", storageError);
        // Continue even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await adminClient
        .from("part_360_frames")
        .delete()
        .eq("part_id", partId);

      if (dbError) {
        console.error("[360-frames] Database deletion error:", dbError);
        throw dbError;
      }
    }

    // Update part record
    const { error: updateError } = await adminClient
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
