"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton, AcrCard } from "@/components/acr";
import { Package, Save } from "lucide-react";
import { SkeletonPartDetailsHeader } from "@/components/ui/skeleton";

interface PartDetailsHeaderProps {
  acrSku?: string;
  partType?: string;
  isSaving?: boolean;
  isLoading?: boolean;
}

/**
 * PartDetailsHeader - Clean, professional header matching public search aesthetic
 *
 * Design Philosophy:
 * - Simple typography (no oversized fonts)
 * - Subtle shadows instead of borders
 * - White background (no gradients)
 * - Red accent only on Save button
 * - Consistent with public search UX patterns
 */
export function PartDetailsHeader({
  acrSku,
  partType,
  isSaving = false,
  isLoading = false,
}: PartDetailsHeaderProps) {
  const { t } = useLocale();

  // Show skeleton while loading
  if (isLoading) {
    return <SkeletonPartDetailsHeader />;
  }

  return (
    <AcrCard variant="default" padding="none" className="overflow-hidden">
      {/* Thin red accent line at top - matches public header pattern */}
      <div className="h-0.5 bg-acr-red-500" />

      <div className="bg-white px-4 py-4 lg:px-6">
        {/* Mobile Layout - Stacked */}
        <div className="flex flex-col gap-4 lg:hidden">
          {/* SKU + Part Type */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-acr-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-acr-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="acr-heading-6 text-acr-gray-900 font-mono truncate">
                {acrSku}
              </h1>
              {partType && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {partType}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Save Button - Full Width on Mobile */}
          <AcrButton
            variant="primary"
            size="default"
            disabled={isSaving}
            className="w-full"
            type="submit"
            form="part-form"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("common.actions.saving")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t("partDetails.actions.saveChanges")}
              </>
            )}
          </AcrButton>
        </div>

        {/* Desktop Layout - Single Line */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Left: Icon + SKU + Part Type Badge */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-acr-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-acr-gray-700" />
            </div>
            <div className="flex items-center gap-4">
              <h1 className="acr-heading-5 text-acr-gray-900 font-mono">
                {acrSku}
              </h1>
              {partType && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {partType}
                </span>
              )}
            </div>
          </div>

          {/* Right: Save Button */}
          <AcrButton
            variant="primary"
            size="default"
            disabled={isSaving}
            type="submit"
            form="part-form"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("common.actions.saving")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t("partDetails.actions.saveChanges")}
              </>
            )}
          </AcrButton>
        </div>
      </div>
    </AcrCard>
  );
}
