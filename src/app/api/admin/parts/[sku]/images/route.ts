import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { Tables, TablesInsert } from "@/lib/supabase/types";
import { PostgrestError } from "@supabase/supabase-js";
import { normalizeSku } from "@/lib/utils/sku";

type PartImage = Tables<"part_images">;

/**
 * GET /api/admin/parts/[sku]/images
 * Get all images for a specific part
 */
export async function GET(
  request: NextRequest,
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
 * Upload multiple images for a part
 */
export async function POST(
  request: NextRequest,
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

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Check current image count
    const { data: existingImages, count: imageCount } = await supabase
      .from("part_images")
      .select("display_order", { count: "exact" })
      .eq("part_id", partId)
      .order("display_order", { ascending: false });

    const MAX_IMAGES = 10; // Matches VALIDATION.maxProductImages in patterns.config.ts
    const currentCount = imageCount || 0;

    if (currentCount >= MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_IMAGES} images per part` },
        { status: 400 }
      );
    }

    const remainingSlots = MAX_IMAGES - currentCount;
    if (files.length > remainingSlots) {
      return NextResponse.json(
        {
          error: `Can only upload ${remainingSlots} more image(s). Maximum ${MAX_IMAGES} images per part.`,
        },
        { status: 400 }
      );
    }

    // New images are added at the end (highest display_order + 1)
    let nextOrder =
      existingImages && existingImages.length > 0
        ? existingImages[0].display_order + 1
        : 0;

    const uploadedImages: PartImage[] = [];

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        continue; // Skip non-image files
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        continue; // Skip files larger than 5MB
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExt = file.name.split(".").pop();
      const fileName = `${partId}_${timestamp}_${randomSuffix}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("acr-part-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue; // Skip this file if upload fails
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("acr-part-images").getPublicUrl(fileName);

      // Create database record
      // Note: is_primary is deprecated, we use display_order (first = primary)
      const newImage: TablesInsert<"part_images"> = {
        part_id: partId,
        image_url: publicUrl,
        display_order: nextOrder++,
        is_primary: false, // Deprecated field, kept for schema compatibility
        caption: null,
      };

      const { data: imageRecord, error: dbError } = await supabase
        .from("part_images")
        .insert(newImage)
        .select()
        .single();

      if (dbError) {
        console.error("Database insert error:", dbError);
        // Clean up uploaded file
        await supabase.storage.from("acr-part-images").remove([fileName]);
        continue;
      }

      uploadedImages.push(imageRecord);
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: "Failed to upload any images" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        images: uploadedImages,
        count: uploadedImages.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}
