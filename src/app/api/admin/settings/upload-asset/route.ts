/**
 * Admin Settings Asset Upload API
 * POST /api/admin/settings/upload-asset - Upload logo, favicon, or other branding assets
 */

import { supabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/x-icon"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/admin/settings/upload-asset
 * Upload a branding asset (logo, favicon, etc.) to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const assetType = formData.get("type") as string | null; // 'logo' | 'favicon' | 'other'

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!assetType) {
      return NextResponse.json(
        { error: "Asset type is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${assetType}-${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("acr-site-assets")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[Settings Upload] Error uploading asset:", error);
      return NextResponse.json(
        { error: "Failed to upload asset" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("acr-site-assets")
      .getPublicUrl(data.path);

    return NextResponse.json({
      message: "Asset uploaded successfully",
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("[Settings Upload] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}