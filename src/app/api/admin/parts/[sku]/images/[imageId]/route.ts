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

    // Get image record to extract filename
    const { data: image, error: fetchError } = await supabase
      .from("part_images")
      .select("*")
      .eq("id", imageId)
      .eq("part_id", partId)
      .single();

    if (fetchError || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Extract storage path from URL
    const bucketName = "acr-part-images";
    const bucketPrefix = `/${bucketName}/`;

    let storagePath: string;
    if (image.image_url.includes(bucketPrefix)) {
      storagePath = image.image_url.split(bucketPrefix)[1];
      storagePath = storagePath.split("?")[0];
    } else {
      const urlParts = image.image_url.split("/");
      storagePath = urlParts[urlParts.length - 1].split("?")[0];
    }

    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([storagePath]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("part_images")
      .delete()
      .eq("id", imageId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API DELETE] Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
