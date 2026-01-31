import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/api/auth-helpers";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadedImage {
  filename: string;
  url: string;
  size: number;
}

/**
 * POST /api/admin/upload-images
 * Upload standalone images for Excel workflow (no part association)
 * Returns public URLs that can be pasted into Excel
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploaded: UploadedImage[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Allowed: JPG, PNG, WebP`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum 5MB`);
        continue;
      }

      // Generate unique filename with UUID
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${randomUUID()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("acr-part-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        errors.push(`${file.name}: Upload failed`);
        continue;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("acr-part-images").getPublicUrl(fileName);

      uploaded.push({
        filename: file.name,
        url: publicUrl,
        size: file.size,
      });
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        uploaded,
        count: uploaded.length,
        errors: errors.length > 0 ? errors : undefined,
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

/**
 * DELETE /api/admin/upload-images
 * Delete an uploaded image by URL
 */
export async function DELETE(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Extract filename from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/acr-part-images/{filename}
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];

    if (!filename) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from("acr-part-images")
      .remove([filename]);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, deleted: filename },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
