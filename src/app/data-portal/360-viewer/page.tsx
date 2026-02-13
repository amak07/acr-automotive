"use client";

import { AppHeader } from "@/components/shared/layout/AppHeader";
import { Viewer360Dashboard } from "@/components/features/admin/360-viewer/Viewer360Dashboard";
import { withAdminAuth } from "@/components/shared/auth/withAdminAuth";

function DataPortal360ViewerPage() {
  return (
    <div>
      <AppHeader variant="data-portal" />
      <Viewer360Dashboard />
    </div>
  );
}

export default withAdminAuth(DataPortal360ViewerPage);
