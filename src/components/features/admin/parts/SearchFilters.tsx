"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { AdminPartsQueryParams } from "@/types";
import { useFilterOptions } from "@/hooks";
import { AcrButton, AcrSearchInput, AcrModal } from "@/components/acr";
import { Filter } from "lucide-react";
import { SearchFiltersSkeleton } from "./SearchFiltersSkeleton";
import { FilterPanel } from "./FilterPanel";
import { FilterBadge } from "./FilterBadge";
import { FilterChips } from "./FilterChips";
import { cn } from "@/lib/utils";

export type SearchTerms = Pick<
  AdminPartsQueryParams,
  | "abs_type"
  | "bolt_pattern"
  | "drive_type"
  | "part_type"
  | "position_type"
  | "search"
>;

type SearchFiltersProps = {
  searchTerms: SearchTerms;
  setSearchTerms: (terms: SearchTerms) => void;
};

export function SearchFilters(props: SearchFiltersProps) {
  const { t } = useLocale();
  const { searchTerms, setSearchTerms } = props;
  const { data: filterOptions, isLoading } = useFilterOptions();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Calculate active filter count (exclude search and __all__)
  const activeFilterCount = Object.entries(searchTerms).filter(
    ([key, value]) => key !== "search" && value !== "" && value !== "__all__"
  ).length;

  const clearAllFilters = () => {
    setSearchTerms({
      search: searchTerms.search, // Keep search term
      part_type: "__all__",
      position_type: "__all__",
      abs_type: "__all__",
      drive_type: "__all__",
      bolt_pattern: "__all__",
    });
  };

  const handleApplyFilters = (terms: SearchTerms) => {
    setSearchTerms(terms);
  };

  const handleRemoveFilter = (key: keyof SearchTerms) => {
    setSearchTerms({
      ...searchTerms,
      [key]: "__all__",
    });
  };

  // Show skeleton when filter options are loading
  if (isLoading) {
    return <SearchFiltersSkeleton />;
  }

  // Prepare filter options for FilterPanel
  const filterOptionsForPanel = filterOptions
    ? {
        partTypes: filterOptions.part_types.map((value) => ({
          value,
          label: value,
        })),
        positionTypes: filterOptions.position_types.map((value) => ({
          value,
          label: value,
        })),
        absTypes: filterOptions.abs_types.map((value) => ({
          value,
          label: value,
        })),
        driveTypes: filterOptions.drive_types.map((value) => ({
          value,
          label: value,
        })),
        boltPatterns: filterOptions.bolt_patterns.map((value) => ({
          value,
          label: value,
        })),
      }
    : {
        partTypes: [],
        positionTypes: [],
        absTypes: [],
        driveTypes: [],
        boltPatterns: [],
      };

  return (
    <div className="space-y-3">
      {/* Search Input with Filter Toggle */}
      <div className="lg:sticky lg:top-4 lg:z-20">
        <div className="bg-white rounded-lg border border-acr-gray-200 p-3 shadow-sm lg:p-4">
          {/* Mobile: Stacked layout with full-width search */}
          <div className="flex flex-col gap-2 lg:hidden">
            <AcrSearchInput
              placeholder={t("admin.search.placeholder")}
              value={searchTerms.search}
              onChange={(e) =>
                setSearchTerms({ ...searchTerms, search: e.target.value })
              }
              size="default"
              className="w-full h-11"
            />

            {/* Filters Toggle Button - Full width on mobile */}
            <AcrButton
              variant="secondary"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={cn(
                "w-full justify-center",
                isFilterPanelOpen && "bg-acr-gray-100"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="ml-2">{t("admin.filters.toggle")}</span>
              {activeFilterCount > 0 && (
                <FilterBadge count={activeFilterCount} />
              )}
            </AcrButton>
          </div>

          {/* Desktop: Side-by-side layout */}
          <div className="hidden lg:flex gap-3">
            <div className="flex-[3]">
              <AcrSearchInput
                placeholder={t("admin.search.placeholder")}
                value={searchTerms.search}
                onChange={(e) =>
                  setSearchTerms({ ...searchTerms, search: e.target.value })
                }
                size="default"
                className="w-full h-11"
              />
            </div>

            {/* Filters Toggle Button */}
            <AcrButton
              variant="secondary"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={cn("shrink-0", isFilterPanelOpen && "bg-acr-gray-100")}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">
                {t("admin.filters.toggle")}
              </span>
              {activeFilterCount > 0 && (
                <FilterBadge count={activeFilterCount} />
              )}
            </AcrButton>
          </div>

          {/* Filter Chips - Show active filters (both mobile and desktop) */}
          {activeFilterCount > 0 && (
            <div className="mt-3">
              <FilterChips
                searchTerms={searchTerms}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={clearAllFilters}
              />
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal - All devices */}
      <AcrModal
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        title={t("admin.filters.toggle")}
      >
        <FilterPanel
          searchTerms={searchTerms}
          onApply={handleApplyFilters}
          onClear={clearAllFilters}
          onClose={() => setIsFilterPanelOpen(false)}
          filterOptions={filterOptionsForPanel}
        />
      </AcrModal>
    </div>
  );
}
