/**
 * Public Settings API
 * GET /api/public/settings - Fetch all public site settings
 * Used by public pages to display contact info, branding, SEO metadata, and active banners
 */

import { supabase } from "@/lib/supabase/client";
import { NextResponse } from "next/server";
import type { SettingKey } from "@/types/domain/settings";

/**
 * GET /api/public/settings
 * Fetch all site settings for public consumption
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .order("key");

    if (error) {
      console.error("[Public Settings API] Error fetching settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Transform array to object keyed by setting key
    const settings = data.reduce(
      (acc, setting) => {
        acc[setting.key as SettingKey] = setting.value;
        return acc;
      },
      {} as Record<string, unknown>
    );

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[Public Settings API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
