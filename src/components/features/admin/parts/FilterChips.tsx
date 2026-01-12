"use client";

import { X } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { SearchTerms } from "./SearchFilters";
import { cn } from "@/lib/utils";

interface FilterChipsProps {
  searchTerms: SearchTerms;
  onRemoveFilter: (key: keyof SearchTerms) => void;
  onClearAll: () => void;
}

export function FilterChips({
  searchTerms,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps) {
  const { t } = useLocale();

  // Get active filters (exclude search and __all__)
  const activeFilters = Object.entries(searchTerms).filter(
    ([key, value]) => key !== "search" && value !== "" && value !== "__all__"
  );

  if (activeFilters.length === 0) {
    return null;
  }

  // Map filter keys to readable labels
  const getFilterLabel = (key: string): string => {
    const labelMap: Record<string, string> = {
      part_type: t("admin.search.partType"),
      position_type: t("admin.search.position"),
      abs_type: t("admin.parts.abs"),
      drive_type: t("partDetails.basicInfo.driveType"),
      bolt_pattern: t("partDetails.basicInfo.boltPattern"),
    };
    return labelMap[key] || key;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 acr-animate-fade-in">
      <span className="text-xs font-medium text-acr-gray-600">
        {t("admin.filters.activeFilters")}:
      </span>
      {activeFilters.map(([key, value]) => (
        <button
          key={key}
          onClick={() => onRemoveFilter(key as keyof SearchTerms)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer",
            "bg-acr-red-50 text-acr-red-700 border border-acr-red-200",
            "text-xs font-medium",
            "hover:bg-acr-red-100 hover:border-acr-red-300",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-1",
            "active:scale-95"
          )}
        >
          <span className="text-acr-gray-600">{getFilterLabel(key)}:</span>
          <span className="font-semibold">{value}</span>
          <X className="w-3.5 h-3.5 ml-0.5" />
        </button>
      ))}
      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer",
            "bg-acr-gray-100 text-acr-gray-700 border border-acr-gray-300",
            "text-xs font-medium",
            "hover:bg-acr-gray-200 hover:border-acr-gray-400",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-acr-gray-500 focus:ring-offset-1",
            "active:scale-95"
          )}
        >
          {t("common.actions.clearFilters")}
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
