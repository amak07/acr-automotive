import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api/auth-helpers";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Create admin client with service role for storage operations (bypasses RLS)
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }

  // Service role client must disable session persistence for server-side use
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

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
    const adminClient = getAdminClient();
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

      // Upload to Supabase Storage (using admin client to bypass RLS)
      const { error: uploadError } = await adminClient.storage
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
      } = adminClient.storage.from("acr-part-images").getPublicUrl(fileName);

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
    const adminClient = getAdminClient();
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

    // Delete from Supabase Storage (using admin client to bypass RLS)
    const { error: deleteError } = await adminClient.storage
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
