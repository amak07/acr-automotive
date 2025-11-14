import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { normalizeSku } from "@/lib/utils/sku-utils";

/**
 * PUT /api/admin/parts/[sku]/images/[imageId]/primary
 * Set an image as the primary image for a part
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string; imageId: string }> }
) {
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

    // Unset all primary flags for this part (database constraint ensures only one primary)
    const { error: unsetError } = await supabase
      .from("part_images")
      .update({ is_primary: false })
      .eq("part_id", partId);

    if (unsetError) throw unsetError;

    // Set new primary
    const { data, error: setPrimaryError } = await supabase
      .from("part_images")
      .update({ is_primary: true })
      .eq("id", imageId)
      .select()
      .single();

    if (setPrimaryError) throw setPrimaryError;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error setting primary image:", error);
    return NextResponse.json(
      { error: "Failed to set primary image" },
      { status: 500 }
    );
  }
}
