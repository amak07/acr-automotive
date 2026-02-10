"use client";

import { AppHeader } from "@/components/shared/layout/AppHeader";
import { UploadImagesDashboard } from "@/components/features/admin/upload-images/UploadImagesDashboard";
import { withAdminAuth } from "@/components/shared/auth/withAdminAuth";

function DataPortalUploadImagesPage() {
  return (
    <div>
      <AppHeader variant="data-portal" />
      <UploadImagesDashboard />
    </div>
  );
}

export default withAdminAuth(DataPortalUploadImagesPage);
