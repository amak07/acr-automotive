import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";
import { normalizeSku } from "@/lib/utils/sku";
import { requireAuth } from "@/lib/api/auth-helpers";

const updateCaptionSchema = z.object({
  caption: z.string().optional().nullable(),
});

/**
 * PUT /api/admin/parts/[sku]/images/[imageId]
 * Update image caption
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string; imageId: string }> }
) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { sku, imageId } = await params;
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
    const body = await request.json();

    // Validate request body
    const { caption } = updateCaptionSchema.parse(body);

    // Verify image exists and belongs to this part
    const { data: image, error: fetchError } = await supabase
      .from("part_images")
      .select("id, part_id")
      .eq("id", imageId)
      .eq("part_id", partId)
      .single();

    if (fetchError || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Update caption
    const { data, error: updateError } = await supabase
      .from("part_images")
      .update({ caption })
      .eq("id", imageId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Error updating image caption:", error);
    return NextResponse.json(
      { error: "Failed to update image" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/parts/[sku]/images/[imageId]
 * Delete an image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string; imageId: string }> }
) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { sku, imageId } = await params;
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
    console.log("[API DELETE] Attempting to delete image:", {
      partId,
      imageId,
    });

    // Get image record to extract filename
    const { data: image, error: fetchError } = await supabase
      .from("part_images")
      .select("*")
      .eq("id", imageId)
      .eq("part_id", partId)
      .single();

    console.log("[API DELETE] Fetch image result:", { image, fetchError });

    if (fetchError || !image) {
      console.error("[API DELETE] Image not found:", {
        imageId,
        partId,
        fetchError,
      });
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Extract storage path from URL
    // URL format: https://xyz.supabase.co/storage/v1/object/public/acr-part-images/filename.jpg
    // Extract everything after the bucket name
    const bucketName = "acr-part-images";
    const bucketPrefix = `/${bucketName}/`;

    let storagePath: string;
    if (image.image_url.includes(bucketPrefix)) {
      // Extract path after bucket name
      storagePath = image.image_url.split(bucketPrefix)[1];
      // Remove any query parameters (e.g., ?timestamp=123)
      storagePath = storagePath.split("?")[0];
    } else {
      // Fallback: just use the filename (last part of URL)
      const urlParts = image.image_url.split("/");
      storagePath = urlParts[urlParts.length - 1].split("?")[0];
    }

    console.log("[API DELETE] Extracted storage path:", storagePath);

    // Delete from storage first (blocking, to ensure cleanup before DB delete)
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([storagePath]);

    if (storageError) {
      console.error("[API DELETE] Storage deletion error:", storageError);
      // Continue with database deletion even if storage fails (orphaned file is better than broken DB)
    } else {
      console.log(
        "[API DELETE] Successfully deleted from storage:",
        storagePath
      );
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("part_images")
      .delete()
      .eq("id", imageId);

    if (dbError) {
      console.error("[API DELETE] Database delete error:", dbError);
      throw dbError;
    }

    console.log("[API DELETE] Successfully deleted from database");

    console.log("[API DELETE] Delete operation completed successfully");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API DELETE] Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
