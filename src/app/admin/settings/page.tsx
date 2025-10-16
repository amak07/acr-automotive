/**
 * Admin Settings Page
 * Manage site-wide settings: Contact Info, Branding, SEO, Banners
 */

"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { SettingsPageContent } from "@/components/admin/settings/SettingsPageContent";
import { withAdminAuth } from "@/components/admin/auth/withAdminAuth";

function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-acr-gray-50 to-acr-gray-100">
      <AppHeader variant="admin" />
      <SettingsPageContent />
    </div>
  );
}

export default withAdminAuth(SettingsPage);
