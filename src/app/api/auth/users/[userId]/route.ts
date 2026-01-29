import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateUserSchema = z.object({
  full_name: z.string().optional(),
  role: z.enum(['admin', 'data_manager']).optional(),
  is_active: z.boolean().optional(),
});

/**
 * PATCH /api/auth/users/:userId
 * Update user profile (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' || !profile?.is_active) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = updateUserSchema.parse(body);

    // Prevent admin from changing their own role or status
    if (userId === user.id) {
      if (updates.role !== undefined || updates.is_active !== undefined) {
        return NextResponse.json(
          { error: 'Cannot modify your own role or status' },
          { status: 400 }
        );
      }
    }

    // Check if target user is an owner (protected from role/status changes)
    if (updates.role !== undefined || updates.is_active !== undefined) {
      const { data: targetProfile } = await supabase
        .from('user_profiles')
        .select('is_owner')
        .eq('id', userId)
        .single();

      if (targetProfile?.is_owner) {
        return NextResponse.json(
          { error: 'Cannot modify owner account' },
          { status: 403 }
        );
      }
    }

    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/users/:userId
 * Deactivate user (admin only)
 * We deactivate instead of deleting to preserve audit trails
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' || !profile?.is_active) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Prevent admin from deactivating themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Check if target user is an owner (protected from deactivation)
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('is_owner')
      .eq('id', userId)
      .single();

    if (targetProfile?.is_owner) {
      return NextResponse.json(
        { error: 'Cannot deactivate owner account' },
        { status: 403 }
      );
    }

    // Deactivate user
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}
