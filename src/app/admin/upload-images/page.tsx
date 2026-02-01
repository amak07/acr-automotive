"use client";

import { AppHeader } from "@/components/shared/layout/AppHeader";
import { UploadImagesDashboard } from "@/components/features/admin/upload-images/UploadImagesDashboard";
import { withAdminAuth } from "@/components/shared/auth/withAdminAuth";

function UploadImagesPage() {
  return (
    <div>
      <AppHeader variant="admin" />
      <UploadImagesDashboard />
    </div>
  );
}

export default withAdminAuth(UploadImagesPage);
