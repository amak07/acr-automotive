"use client";

import { AppHeader } from "@/components/shared/layout/AppHeader";
import { ImportBreadcrumb } from "@/components/features/admin/layout/ImportBreadcrumb";
import { ImportWizard } from "@/components/features/admin/import/ImportWizard";
import { withAdminAuth } from "@/components/shared/auth/withAdminAuth";

function ImportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-acr-gray-50 to-acr-gray-100">
      <AppHeader variant="admin" />
      <main className="px-4 py-8 mx-auto lg:max-w-7xl lg:px-8">
        <ImportBreadcrumb />
        <ImportWizard />
      </main>
    </div>
  );
}

export default withAdminAuth(ImportPage);
