"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrCard } from "@/components/acr";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface MobileCompletionBarProps {
  completionStatus: {
    basicInfo: boolean;
    media: boolean;
    applications: boolean;
    crossReferences: boolean;
  };
}

const SECTION_KEYS = {
  basicInfo: "basicInfo",
  media: "media",
  applications: "applications",
  crossReferences: "crossReferences",
} as const;

/**
 * MobileCompletionBar - Compact progress indicator for mobile/tablet
 *
 * Shows completion percentage, progress bar, and next incomplete section hint.
 * Ensures mobile users have completion guidance parity with desktop sidebar.
 *
 * Design Philosophy (matches public search patterns):
 * - Simple typography (no bold oversized fonts)
 * - Subtle colors and borders
 * - Thin red accent line instead of thick colored borders
 * - Professional, clean aesthetic
 * - Minimal use of color for status indicators
 */
export function MobileCompletionBar({
  completionStatus,
}: MobileCompletionBarProps) {
  const { t } = useLocale();

  // Calculate completion metrics
  const completionCount =
    Object.values(completionStatus).filter(Boolean).length;
  const completionPercentage = (completionCount / 4) * 100;
  const isComplete = completionPercentage === 100;

  // Find first incomplete section to show as hint
  const incompleteSection = Object.entries(completionStatus).find(
    ([_, isComplete]) => !isComplete
  )?.[0] as keyof typeof SECTION_KEYS | undefined;

  return (
    <AcrCard variant="default" padding="none" className="overflow-hidden">
      {/* Thin red accent line at top - matches sidebar cards */}
      <div className="h-0.5 bg-acr-red-500" />

      <div className="p-3">
        {/* Progress bar with percentage */}
        <div className="flex items-center gap-3 mb-2">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-acr-gray-400 shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="acr-caption font-semibold text-acr-gray-700 uppercase tracking-wide">
                {t("partDetails.completion.title")}
              </span>
              <span className="acr-caption font-bold text-acr-gray-900">
                {completionPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-acr-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500 ease-out bg-acr-red-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Incomplete section hint */}
        {!isComplete && incompleteSection && (
          <div className="flex items-center gap-2 pl-7">
            <span className="acr-caption text-acr-gray-500">
              {t("partDetails.completion.nextStep")}:
            </span>
            <span className="acr-caption font-medium text-acr-gray-700">
              {t(`partDetails.completion.${incompleteSection}`)}
            </span>
          </div>
        )}
      </div>
    </AcrCard>
  );
}
