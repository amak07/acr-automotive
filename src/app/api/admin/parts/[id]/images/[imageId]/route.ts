import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";

const updateCaptionSchema = z.object({
  caption: z.string().optional().nullable(),
});

/**
 * PUT /api/admin/parts/[id]/images/[imageId]
 * Update image caption
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: partId, imageId } = await params;
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
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
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
 * DELETE /api/admin/parts/[id]/images/[imageId]
 * Delete an image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: partId, imageId } = await params;
    console.log("[API DELETE] Attempting to delete image:", { partId, imageId });

    // Get image record to extract filename
    const { data: image, error: fetchError } = await supabase
      .from("part_images")
      .select("*")
      .eq("id", imageId)
      .eq("part_id", partId)
      .single();

    console.log("[API DELETE] Fetch image result:", { image, fetchError });

    if (fetchError || !image) {
      console.error("[API DELETE] Image not found:", { imageId, partId, fetchError });
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Extract filename from URL
    // URL format: https://xyz.supabase.co/storage/v1/object/public/acr-part-images/filename.jpg
    const urlParts = image.image_url.split("/");
    const fileName = urlParts[urlParts.length - 1];
    console.log("[API DELETE] Extracted filename:", fileName);

    // Delete from database first
    const { error: dbError } = await supabase
      .from("part_images")
      .delete()
      .eq("id", imageId);

    if (dbError) {
      console.error("[API DELETE] Database delete error:", dbError);
      throw dbError;
    }

    console.log("[API DELETE] Successfully deleted from database");

    // Delete from storage (non-blocking, log errors but don't fail the request)
    supabase.storage
      .from("acr-part-images")
      .remove([fileName])
      .then(() => {
        console.log("[API DELETE] Successfully deleted from storage:", fileName);
      })
      .catch((error) => {
        console.error("[API DELETE] Failed to delete file from storage:", error);
      });

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
