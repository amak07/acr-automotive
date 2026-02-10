import { NextRequest, NextResponse } from "next/server";
import { supabase, createAdminClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/types";
import { normalizeSku } from "@/lib/utils/sku";
import { requireAuth } from "@/lib/api/auth-helpers";

type PartImage = Tables<"part_images">;

const VALID_VIEW_TYPES = ["front", "back", "top", "other"] as const;
type ViewType = (typeof VALID_VIEW_TYPES)[number];

/**
 * GET /api/admin/parts/[sku]/images
 * Get all images for a specific part
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  // Require authentication
  const authResult = await requireAuth(request);
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

    // Fetch all images for this part, ordered by display_order
    const { data, error } = await supabase
      .from("part_images")
      .select("*")
      .eq("part_id", part.id)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching part images:", error);
    return NextResponse.json(
      { error: "Failed to fetch part images" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/parts/[sku]/images
 * Upload a single image for a specific view_type slot (front/back/top/other).
 * If the slot already has an image, it replaces it (deletes old file from storage).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  // Require authentication
  const authResult = await requireAuth(request);
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const viewType = formData.get("view_type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!viewType || !VALID_VIEW_TYPES.includes(viewType as ViewType)) {
      return NextResponse.json(
        {
          error: `Invalid view_type. Must be one of: ${VALID_VIEW_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 5MB" },
        { status: 400 }
      );
    }

    // Check if slot already has an image (for replacement)
    const { data: existingImage } = await supabase
      .from("part_images")
      .select("*")
      .eq("part_id", partId)
      .eq("view_type", viewType)
      .single();

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileExt = file.name.split(".").pop();
    const fileName = `${partId}_${viewType}_${timestamp}_${randomSuffix}.${fileExt}`;

    // Use admin client for storage operations (route is already auth-gated)
    const adminClient = createAdminClient();

    // Upload to Supabase Storage
    const { error: uploadError } = await adminClient.storage
      .from("acr-part-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("acr-part-images").getPublicUrl(fileName);

    // Display order maps: front=0, back=1, top=2, other=3
    const displayOrderMap: Record<string, number> = {
      front: 0,
      back: 1,
      top: 2,
      other: 3,
    };

    let imageRecord: PartImage;

    if (existingImage) {
      // Replace existing: delete old file from storage, update DB record
      const oldStoragePath = extractStoragePath(existingImage.image_url);
      if (oldStoragePath) {
        await adminClient.storage
          .from("acr-part-images")
          .remove([oldStoragePath]);
      }

      const { data: updated, error: updateError } = await adminClient
        .from("part_images")
        .update({
          image_url: publicUrl,
          is_primary: viewType === "front",
          display_order: displayOrderMap[viewType],
        })
        .eq("id", existingImage.id)
        .select()
        .single();

      if (updateError) {
        // Clean up uploaded file on DB error
        await adminClient.storage.from("acr-part-images").remove([fileName]);
        throw updateError;
      }

      imageRecord = updated;
    } else {
      // Create new record
      const { data: inserted, error: insertError } = await adminClient
        .from("part_images")
        .insert({
          part_id: partId,
          image_url: publicUrl,
          view_type: viewType,
          display_order: displayOrderMap[viewType],
          is_primary: viewType === "front",
          caption: null,
        })
        .select()
        .single();

      if (insertError) {
        // Clean up uploaded file on DB error
        await adminClient.storage.from("acr-part-images").remove([fileName]);
        throw insertError;
      }

      imageRecord = inserted;
    }

    return NextResponse.json(
      {
        success: true,
        image: imageRecord,
        replaced: !!existingImage,
        count: 1,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

/**
 * Extract the storage path from a Supabase public URL.
 * URL format: https://xyz.supabase.co/storage/v1/object/public/acr-part-images/filename.jpg
 */
function extractStoragePath(imageUrl: string): string | null {
  const bucketName = "acr-part-images";
  const bucketPrefix = `/${bucketName}/`;

  if (imageUrl.includes(bucketPrefix)) {
    let path = imageUrl.split(bucketPrefix)[1];
    path = path.split("?")[0]; // Remove query params
    return path;
  }

  // Fallback: just use the filename
  const urlParts = imageUrl.split("/");
  const filename = urlParts[urlParts.length - 1]?.split("?")[0];
  return filename || null;
}
