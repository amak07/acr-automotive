/**
 * Admin Settings API
 * GET  /api/admin/settings - Fetch all site settings
 * PUT  /api/admin/settings - Update a specific setting by key
 */

import { supabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";
import { updateSettingSchema } from "@/lib/schemas/admin";
import type { SettingKey } from "@/lib/types/settings";

/**
 * GET /api/admin/settings
 * Fetch all site settings
 */
export async function GET() {
  try {

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("key");

    if (error) {
      console.error("[Settings API] Error fetching settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Transform array to object keyed by setting key
    const settings = data.reduce((acc, setting) => {
      acc[setting.key as SettingKey] = setting.value;
      return acc;
    }, {} as Record<string, unknown>);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[Settings API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Update a specific setting by key
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = updateSettingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { key, value } = validation.data;

    // Update the setting
    const { data, error } = await supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key)
      .select()
      .single();

    if (error) {
      console.error(`[Settings API] Error updating ${key}:`, error);
      return NextResponse.json(
        { error: `Failed to update ${key}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully updated ${key}`,
      setting: data
    });
  } catch (error) {
    console.error("[Settings API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}