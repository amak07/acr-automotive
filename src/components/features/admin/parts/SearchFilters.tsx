"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { AdminPartsQueryParams } from "@/types";
import { useFilterOptions } from "@/hooks";
import { AcrButton, AcrSearchInput, AcrModal } from "@/components/acr";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { SearchFiltersSkeleton } from "./SearchFiltersSkeleton";
import { FilterPanel } from "./FilterPanel";
import { FilterBadge } from "./FilterBadge";
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
    <div className="space-y-4">
      {/* Collapsed State: Search + Filters Button */}
      <div className="flex gap-3 items-center">
        {/* Search Input */}
        <AcrSearchInput
          placeholder={t("admin.search.placeholder")}
          value={searchTerms.search}
          onChange={(e) =>
            setSearchTerms({ ...searchTerms, search: e.target.value })
          }
          size="default"
          className="flex-1"
        />

        {/* Filters Toggle Button */}
        <AcrButton
          variant="secondary"
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          className={cn(
            "whitespace-nowrap",
            isFilterPanelOpen && "bg-acr-gray-100"
          )}
        >
          <Filter className="w-4 h-4 mr-2" />
          {t("admin.filters.toggle")}
          {activeFilterCount > 0 && <FilterBadge count={activeFilterCount} />}
          {isFilterPanelOpen ? (
            <ChevronUp className="w-4 h-4 ml-2" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-2" />
          )}
        </AcrButton>
      </div>

      {/* Desktop: Inline Collapsible Filter Panel */}
      {isFilterPanelOpen && (
        <div className="hidden md:block">
          <FilterPanel
            searchTerms={searchTerms}
            onApply={handleApplyFilters}
            onClear={clearAllFilters}
            filterOptions={filterOptionsForPanel}
          />
        </div>
      )}

      {/* Mobile: Bottom Sheet Modal */}
      {isFilterPanelOpen && (
        <div className="md:hidden">
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
      )}
    </div>
  );
}
