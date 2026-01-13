"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton, AcrCard } from "@/components/acr";
import {
  Save,
  Eye,
  ArrowLeft,
  Package,
  MapPin,
  Link2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/acr";

interface PartDetailsSidebarProps {
  acrSku?: string;
  partType?: string;
  vehicleCount?: number;
  crossReferenceCount?: number;
  isSaving?: boolean;
  isDirty?: boolean;
  isLoading?: boolean;
  completionStatus?: {
    basicInfo: boolean;
    media: boolean;
    applications: boolean;
    crossReferences: boolean;
  };
}

/**
 * PartDetailsSidebar - Professional, clean sidebar matching public UX patterns
 *
 * Design Philosophy:
 * - Simple typography (no oversized headings)
 * - Gray backgrounds and borders (no flashy colors)
 * - Subtle red accent line at top of cards
 * - White space for breathing room
 * - No gradients except on buttons
 * - Consistent with public search aesthetic
 */
export function PartDetailsSidebar({
  acrSku,
  partType,
  vehicleCount = 0,
  crossReferenceCount = 0,
  isSaving = false,
  isDirty = false,
  isLoading = false,
  completionStatus = {
    basicInfo: true,
    media: false,
    applications: false,
    crossReferences: false,
  },
}: PartDetailsSidebarProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleBack = () => {
    if (isDirty) {
      setShowConfirmDialog(true);
    } else {
      router.push("/admin");
    }
  };

  const handleConfirmBack = () => {
    router.push("/admin");
  };

  // Calculate overall completion percentage
  const completionCount =
    Object.values(completionStatus).filter(Boolean).length;
  const completionPercentage = (completionCount / 4) * 100;

  return (
    <>
      <div className="space-y-5">
        {/* Card 1: Part Identity & Stats */}
        <AcrCard variant="default" padding="none" className="overflow-hidden">
          {/* Thin red accent line at top */}
          <div className="h-0.5 bg-acr-red-500" />

          <div className="px-5 py-5">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-acr-gray-500" />
              <h2 className="acr-body-small font-semibold text-acr-gray-700 uppercase tracking-wide">
                {t("partDetails.sidebar.identity")}
              </h2>
            </div>

            <div className="space-y-4">
              {/* ACR SKU */}
              <div>
                <div className="acr-caption text-acr-gray-500 mb-1">
                  {t("partDetails.basicInfo.acrSku")}
                </div>
                <div className="acr-heading-6 text-acr-gray-900 font-mono">
                  {acrSku || "---"}
                </div>
              </div>

              {/* Part Type */}
              {partType && (
                <div>
                  <div className="acr-caption text-acr-gray-500 mb-1">
                    {t("partDetails.basicInfo.partType")}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {partType}
                  </span>
                </div>
              )}

              {/* Quick Stats */}
              <div className="pt-4 border-t border-acr-gray-200">
                <div className="acr-caption text-acr-gray-500 mb-3 uppercase tracking-wide">
                  {t("partDetails.sidebar.quickStats")}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Applications */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <MapPin className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="acr-heading-5 text-acr-gray-900">
                      {vehicleCount}
                    </div>
                    <div className="acr-caption text-acr-gray-600 mt-0.5">
                      {t("admin.parts.applications")}
                    </div>
                  </div>

                  {/* Cross References */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Link2 className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="acr-heading-5 text-acr-gray-900">
                      {crossReferenceCount}
                    </div>
                    <div className="acr-caption text-acr-gray-600 mt-0.5">
                      {t("admin.dashboard.crossReferences")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AcrCard>

        {/* Card 2: Completion Status & Actions */}
        <AcrCard variant="default" padding="none" className="overflow-hidden">
          {/* Thin red accent line at top */}
          <div className="h-0.5 bg-acr-red-500" />

          <div className="px-5 py-5">
            {/* Completion Status Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-acr-gray-500" />
                <h2 className="acr-body-small font-semibold text-acr-gray-700 uppercase tracking-wide">
                  {t("partDetails.completion.title")}
                </h2>
              </div>
              <span className="acr-body-small font-bold text-acr-gray-900">
                {completionPercentage.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-acr-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-acr-red-500 transition-all duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Completion Checklist */}
            <div className="space-y-2 mb-5">
              {[
                {
                  key: "basicInfo",
                  label: t("partDetails.completion.basicInfo"),
                },
                {
                  key: "media",
                  label: t("partDetails.completion.media"),
                },
                {
                  key: "applications",
                  label: t("partDetails.completion.applications"),
                },
                {
                  key: "crossReferences",
                  label: t("partDetails.completion.crossReferences"),
                },
              ].map((item) => {
                const isComplete =
                  completionStatus[item.key as keyof typeof completionStatus];
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-2 acr-body-small"
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-acr-gray-400 shrink-0" />
                    )}
                    <span
                      className={
                        isComplete
                          ? "text-acr-gray-900 font-medium"
                          : "text-acr-gray-500"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-acr-gray-200 my-5" />

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Save Button */}
              <AcrButton
                variant="primary"
                size="default"
                className="w-full"
                disabled={isSaving || !isDirty}
                type="submit"
                form="part-form"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t("common.actions.saving")}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t("partDetails.actions.saveChanges")}</span>
                  </>
                )}
              </AcrButton>

              {/* Preview Button */}
              <Link
                href={
                  acrSku
                    ? `/parts/${encodeURIComponent(acrSku)}?from=admin`
                    : "#"
                }
                className="block"
              >
                <AcrButton
                  variant="secondary"
                  size="default"
                  className="w-full"
                  disabled={!acrSku}
                  type="button"
                >
                  <Eye className="w-4 h-4" />
                  <span>{t("partDetails.actions.preview")}</span>
                </AcrButton>
              </Link>

              {/* Back Button */}
              <AcrButton
                variant="ghost"
                size="default"
                className="w-full"
                onClick={handleBack}
                type="button"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("common.actions.back")}</span>
              </AcrButton>
            </div>

            {/* Unsaved Changes Indicator */}
            {isDirty && (
              <div className="mt-4 pt-4 border-t border-acr-gray-200">
                <div className="flex items-center gap-2 acr-caption">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0" />
                  <span className="font-medium text-orange-600">
                    {t("common.confirm.unsavedChanges.title")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </AcrCard>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmBack}
        title={t("common.confirm.unsavedChanges.title")}
        description={t("common.confirm.unsavedChanges.description")}
        confirmText={t("common.actions.discard")}
        cancelText={t("common.actions.cancel")}
        variant="warning"
      />
    </>
  );
}
