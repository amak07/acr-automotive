import { NextResponse } from "next/server";

export async function GET() {
  console.log('Debug endpoint called');

  return NextResponse.json({
    success: true,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
      timestamp: new Date().toISOString()
    }
  });
}