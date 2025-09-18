"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton, AcrCard, AcrCardHeader, AcrCardContent } from "@/components/acr";
import { Car, Plus, Loader2 } from "lucide-react";

interface PartApplicationsProps {
  vehicleCount?: number;
  partId: string;
}

export function PartApplications({ vehicleCount = 0, partId }: PartApplicationsProps) {
  const { t } = useLocale();

  return (
    <AcrCard variant="default" padding="none" className="mb-6">
      <AcrCardHeader className="px-4 pt-6 lg:px-6">
        {/* Mobile Layout - Stacked */}
        <div className="block lg:hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-acr-gray-900">
              {t("admin.parts.vehicleApplications")}
            </h2>
            <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {vehicleCount}
            </span>
          </div>
          <AcrButton variant="primary" size="default" className="w-full">
            <Plus className="w-4 h-4" />
            Add Application
          </AcrButton>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-acr-gray-900">
              {t("admin.parts.vehicleApplications")}
            </h2>
            <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {vehicleCount} {t("admin.parts.vehicles")}
            </span>
          </div>

          <AcrButton variant="primary" size="default">
            <Plus className="w-4 h-4" />
            Add Application
          </AcrButton>
        </div>
      </AcrCardHeader>

      <AcrCardContent className="px-4 pb-6 lg:px-6">
        {/* Loading state for now - will be replaced with actual data later */}
        <div className="flex items-center justify-center py-12 border-2 border-dashed border-acr-gray-200 rounded-lg">
          <div className="text-center">
            <Car className="w-12 h-12 text-acr-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-acr-gray-900 mb-2">
              {t("partDetails.empty.noApplications")}
            </h3>
            <p className="text-sm text-acr-gray-500 mb-4">
              {t("partDetails.empty.applicationsDescription")}
            </p>
            <AcrButton variant="primary" size="default">
              <Plus className="w-4 h-4 mr-2" />
              {t("partDetails.empty.addFirstApplication")}
            </AcrButton>
          </div>
        </div>
      </AcrCardContent>
    </AcrCard>
  );
}