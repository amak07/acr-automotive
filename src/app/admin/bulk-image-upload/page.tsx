"use client";

import { Suspense } from "react";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { BulkImageUploadPage } from "@/components/features/admin/bulk-image-upload/BulkImageUploadPage";
import { withAdminAuth } from "@/components/shared/auth/withAdminAuth";
import { Skeleton } from "@/components/ui/skeleton";

function BulkImageUploadPageContent() {
  return (
    <>
      <AppHeader variant="admin" />
      <main className="px-4 py-8 mx-auto lg:max-w-7xl lg:px-8">
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
              <Skeleton className="h-96" />
            </div>
          }
        >
          <BulkImageUploadPage />
        </Suspense>
      </main>
    </>
  );
}

export default withAdminAuth(BulkImageUploadPageContent);
