"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrSpinner } from "@/components/acr/Spinner";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { ImportWizard } from "@/components/features/admin/import/ImportWizard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Data Manager Import Page
 *
 * Simplified import interface for data managers.
 * Uses AppHeader with data-portal variant and breadcrumb navigation.
 */
export default function DataManagerImportPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const { t } = useLocale();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AcrSpinner size="lg" color="primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user || !profile) {
    router.push("/login?redirect=/data-portal/import");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-acr-gray-50 to-acr-gray-100">
      <AppHeader variant="data-portal" />

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto md:px-6 lg:max-w-7xl lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/data-portal"
                  className="text-acr-gray-600 hover:text-acr-gray-800"
                >
                  {t("portal.title")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-acr-gray-600" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-acr-gray-800 font-medium">
                  {t("portal.import.title")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <ImportWizard />
      </main>
    </div>
  );
}
