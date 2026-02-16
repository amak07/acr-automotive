/**
 * Settings Page (top-level route, admin-only)
 * Manage site-wide settings: Contact Info, Branding, SEO, Banners
 */

"use client";

import { AppHeader } from "@/components/shared/layout/AppHeader";
import { SettingsPageContent } from "@/components/features/admin/settings/SettingsPageContent";
import { withAdminAuth } from "@/components/shared/auth/withAdminAuth";

function SettingsPage() {
  return (
    <div>
      <AppHeader variant="admin" />
      <SettingsPageContent />
    </div>
  );
}

export default withAdminAuth(SettingsPage);
