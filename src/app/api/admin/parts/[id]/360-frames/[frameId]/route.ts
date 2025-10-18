import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * DELETE /api/admin/parts/[id]/360-frames/[frameId]
 * Delete a single 360° frame
 *
 * Note: After deleting a frame, the remaining frames keep their original
 * frame_number values. The UI will need to handle gaps in the sequence
 * or trigger a re-upload if continuity is required.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; frameId: string }> }
) {
  try {
    const { id: partId, frameId } = await params;
    console.log("[360-frames DELETE] Attempting to delete frame:", {
      partId,
      frameId,
    });

    // Get frame record to extract storage path
    const { data: frame, error: fetchError } = await supabase
      .from("part_360_frames")
      .select("*")
      .eq("id", frameId)
      .eq("part_id", partId)
      .single();

    console.log("[360-frames DELETE] Fetch frame result:", {
      frame,
      fetchError,
    });

    if (fetchError || !frame) {
      console.error("[360-frames DELETE] Frame not found:", {
        frameId,
        partId,
        fetchError,
      });
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    // Delete from database first
    const { error: dbError } = await supabase
      .from("part_360_frames")
      .delete()
      .eq("id", frameId);

    if (dbError) {
      console.error("[360-frames DELETE] Database delete error:", dbError);
      throw dbError;
    }

    console.log("[360-frames DELETE] Successfully deleted from database");

    // Delete from storage (non-blocking, log errors but don't fail the request)
    supabase.storage
      .from("acr-part-images")
      .remove([frame.storage_path])
      .then(() => {
        console.log(
          "[360-frames DELETE] Successfully deleted from storage:",
          frame.storage_path
        );
      })
      .catch((error) => {
        console.error(
          "[360-frames DELETE] Failed to delete file from storage:",
          error
        );
      });

    // Update part frame count
    const { data: remainingFrames } = await supabase
      .from("part_360_frames")
      .select("id")
      .eq("part_id", partId);

    const remainingCount = remainingFrames?.length || 0;

    await supabase
      .from("parts")
      .update({
        has_360_viewer: remainingCount >= 12, // Minimum frame count
        viewer_360_frame_count: remainingCount,
      })
      .eq("id", partId);

    console.log("[360-frames DELETE] Delete operation completed successfully");
    return NextResponse.json({ success: true, remainingCount }, { status: 200 });
  } catch (error) {
    console.error("[360-frames DELETE] Error deleting frame:", error);
    return NextResponse.json(
      { error: "Failed to delete frame" },
      { status: 500 }
    );
  }
}
