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
 * Deactivate or permanently delete user (admin only)
 *
 * Query params:
 * - permanent=true: Permanently delete (only works for already deactivated users)
 * - Without permanent: Deactivate (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

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

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check target user's status
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('is_owner, is_active')
      .eq('id', userId)
      .single();

    if (targetProfile?.is_owner) {
      return NextResponse.json(
        { error: 'Cannot delete owner account' },
        { status: 403 }
      );
    }

    if (permanent) {
      // Permanent deletion - only allowed for deactivated users
      if (targetProfile?.is_active) {
        return NextResponse.json(
          { error: 'User must be deactivated before permanent deletion' },
          { status: 400 }
        );
      }

      // Check for service role key
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      // Use admin client to delete auth user
      const { createClient: createAdminClient } = await import('@supabase/supabase-js');
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Delete auth user (this will cascade delete the profile due to FK constraint)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('Delete auth user error:', deleteError);
        throw deleteError;
      }

      return NextResponse.json({ success: true, deleted: true });
    } else {
      // Soft delete - deactivate user
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, deactivated: true });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
