import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const localeSchema = z.object({
  preferred_locale: z.enum(['en', 'es']).nullable(),
});

/**
 * PATCH /api/auth/profile/locale
 * Allows any authenticated user to update their own language preference.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { preferred_locale } = localeSchema.parse(body);

    const { error } = await supabase
      .from('user_profiles')
      .update({ preferred_locale })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }
    console.error('Update locale error:', error);
    return NextResponse.json({ error: 'Failed to update locale' }, { status: 500 });
  }
}
