import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";

const reorderSchema = z.object({
  image_ids: z.array(z.string().uuid()).min(1),
});

/**
 * PUT /api/admin/parts/[id]/images/reorder
 * Reorder images for a part
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partId } = await params;
    const body = await request.json();

    // Validate request body
    const { image_ids } = reorderSchema.parse(body);

    // Verify all images belong to this part
    const { data: images, error: fetchError } = await supabase
      .from("part_images")
      .select("id, part_id")
      .eq("part_id", partId)
      .in("id", image_ids);

    if (fetchError) throw fetchError;

    if (!images || images.length !== image_ids.length) {
      return NextResponse.json(
        { error: "Some images do not exist or do not belong to this part" },
        { status: 400 }
      );
    }

    // Update display_order for each image
    const updates = image_ids.map((imageId, index) => ({
      id: imageId,
      display_order: index,
    }));

    // Perform batch update
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("part_images")
        .update({ display_order: update.display_order })
        .eq("id", update.id)
        .eq("part_id", partId);

      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
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

    console.error("Error reordering images:", error);
    return NextResponse.json(
      { error: "Failed to reorder images" },
      { status: 500 }
    );
  }
}
