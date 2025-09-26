"use client";

import { Dispatch, SetStateAction } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Search, XCircleIcon } from "lucide-react";
import { AdminPartsQueryParams } from "@/types";
import { useFilterOptions } from "@/hooks";
import { AcrInput, AcrButton, AcrSelect, AcrLabel } from "@/components/acr";
import { SearchFiltersSkeleton } from "./SearchFiltersSkeleton";

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
  setSearchTerms: Dispatch<SetStateAction<SearchTerms>>;
};

export function SearchFilters(props: SearchFiltersProps) {
  const { t } = useLocale();
  const { searchTerms, setSearchTerms } = props;
  const { data: filterOptions, isLoading } = useFilterOptions();

  const clearAllFilters = () => {
    setSearchTerms({
      search: "",
      part_type: "__all__",
      position_type: "__all__",
      abs_type: "__all__",
      drive_type: "__all__",
      bolt_pattern: "__all__",
    });
  };

  const hasActiveFilters = Object.values(searchTerms).some(
    (value) => value !== "" && value !== "__all__"
  );

  // Show skeleton when filter options are loading
  if (isLoading) {
    return <SearchFiltersSkeleton />;
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-acr-gray-200 shadow-sm mb-6 lg:p-6">
      {/* Mobile: Stacked Layout */}
      <div className="lg:hidden space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-acr-gray-400 w-4 h-4 pointer-events-none" />
          <AcrInput
            type="text"
            placeholder={t("admin.search.placeholder")}
            value={searchTerms.search}
            onChange={(e) =>
              setSearchTerms({ ...searchTerms, search: e.target.value })
            }
            className="pl-10 pr-10 text-sm"
          />
          {searchTerms.search && (
            <AcrButton
              onClick={() => setSearchTerms({ ...searchTerms, search: "" })}
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-auto w-auto p-0 text-acr-gray-400 hover:text-acr-gray-600"
            >
              <XCircleIcon className="w-4 h-4" />
            </AcrButton>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-3 md:grid-cols-3">
          <AcrSelect.Root
            value={searchTerms.part_type}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, part_type: value })
            }
            disabled={isLoading}
          >
            <AcrSelect.Trigger
              variant={isLoading ? "disabled" : "default"}
              className="text-sm"
            >
              <AcrSelect.Value
                placeholder={isLoading ? "Loading..." : t("common.actions.all")}
              />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions?.part_types.map((partType) => (
                <AcrSelect.Item key={partType} value={partType}>
                  {partType}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={searchTerms.position_type}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, position_type: value })
            }
            disabled={isLoading}
          >
            <AcrSelect.Trigger
              variant={isLoading ? "disabled" : "default"}
              className="text-sm"
            >
              <AcrSelect.Value
                placeholder={isLoading ? "Loading..." : t("common.actions.all")}
              />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions?.position_types.map((position) => (
                <AcrSelect.Item key={position} value={position}>
                  {position}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={searchTerms.abs_type}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, abs_type: value })
            }
            disabled={isLoading}
          >
            <AcrSelect.Trigger
              variant={isLoading ? "disabled" : "default"}
              className="text-sm"
            >
              <AcrSelect.Value
                placeholder={isLoading ? "Loading..." : t("common.actions.all")}
              />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions?.abs_types.map((abs) => (
                <AcrSelect.Item key={abs} value={abs}>
                  {abs}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>
        </div>

        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-3">
          <AcrSelect.Root
            value={searchTerms.drive_type}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, drive_type: value })
            }
            disabled={isLoading}
          >
            <AcrSelect.Trigger
              variant={isLoading ? "disabled" : "default"}
              className="text-sm"
            >
              <AcrSelect.Value
                placeholder={isLoading ? "Loading..." : t("common.actions.all")}
              />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions?.drive_types.map((drive) => (
                <AcrSelect.Item key={drive} value={drive}>
                  {drive}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={searchTerms.bolt_pattern}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, bolt_pattern: value })
            }
            disabled={isLoading}
          >
            <AcrSelect.Trigger
              variant={isLoading ? "disabled" : "default"}
              className="text-sm"
            >
              <AcrSelect.Value
                placeholder={isLoading ? "Loading..." : t("common.actions.all")}
              />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions?.bolt_patterns.map((pattern) => (
                <AcrSelect.Item key={pattern} value={pattern}>
                  {pattern}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>
        </div>

        {/* Clear Filters Button - Mobile */}
        {hasActiveFilters && (
          <div className="pt-2">
            <AcrButton
              onClick={clearAllFilters}
              variant="ghost"
              className="w-full text-acr-red-600 bg-acr-red-50 border border-acr-red-200 hover:bg-acr-red-100"
            >
              {t("common.actions.clearFilters")}
            </AcrButton>
          </div>
        )}
      </div>

      {/* Desktop: Two-row Layout */}
      <div className="hidden lg:block space-y-4">
        {/* Top Row: Search (2/3) + Part Type (1/3) */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <AcrLabel>{t("admin.search.button")}</AcrLabel>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-acr-gray-400 w-4 h-4 pointer-events-none" />
              <AcrInput
                type="text"
                placeholder={t("admin.search.placeholder")}
                value={searchTerms.search}
                onChange={(e) =>
                  setSearchTerms({ ...searchTerms, search: e.target.value })
                }
                className="pl-10 pr-10"
              />
              {searchTerms.search && (
                <AcrButton
                  onClick={() => setSearchTerms({ ...searchTerms, search: "" })}
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-auto w-auto p-0 text-acr-gray-400 hover:text-acr-gray-600"
                >
                  <XCircleIcon className="w-4 h-4" />
                </AcrButton>
              )}
            </div>
          </div>

          <div className="w-1/3">
            <AcrLabel>{t("admin.search.partType")}</AcrLabel>
            <AcrSelect.Root
              value={searchTerms.part_type}
              onValueChange={(value) =>
                setSearchTerms({ ...searchTerms, part_type: value })
              }
              disabled={isLoading}
            >
              <AcrSelect.Trigger variant={isLoading ? "disabled" : "default"}>
                <AcrSelect.Value
                  placeholder={
                    isLoading ? "Loading..." : t("common.actions.all")
                  }
                />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="__all__">
                  {t("common.actions.all")}
                </AcrSelect.Item>
                {filterOptions?.part_types.map((partType) => (
                  <AcrSelect.Item key={partType} value={partType}>
                    {partType}
                  </AcrSelect.Item>
                ))}
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>
        </div>

        {/* Bottom Row: 4 remaining filters equally spaced */}
        <div className="grid grid-cols-4 gap-4">
          {/* Position Filter */}
          <div>
            <AcrLabel>{t("admin.search.position")}</AcrLabel>
            <AcrSelect.Root
              value={searchTerms.position_type}
              onValueChange={(value) =>
                setSearchTerms({ ...searchTerms, position_type: value })
              }
              disabled={isLoading}
            >
              <AcrSelect.Trigger variant={isLoading ? "disabled" : "default"}>
                <AcrSelect.Value
                  placeholder={
                    isLoading ? "Loading..." : t("common.actions.all")
                  }
                />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="__all__">
                  {t("common.actions.all")}
                </AcrSelect.Item>
                {filterOptions?.position_types.map((position) => (
                  <AcrSelect.Item key={position} value={position}>
                    {position}
                  </AcrSelect.Item>
                ))}
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>

          {/* ABS Filter */}
          <div>
            <AcrLabel>ABS</AcrLabel>
            <AcrSelect.Root
              value={searchTerms.abs_type}
              onValueChange={(value) =>
                setSearchTerms({ ...searchTerms, abs_type: value })
              }
              disabled={isLoading}
            >
              <AcrSelect.Trigger variant={isLoading ? "disabled" : "default"}>
                <AcrSelect.Value
                  placeholder={
                    isLoading ? "Loading..." : t("common.actions.all")
                  }
                />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="__all__">
                  {t("common.actions.all")}
                </AcrSelect.Item>
                {filterOptions?.abs_types.map((abs) => (
                  <AcrSelect.Item key={abs} value={abs}>
                    {abs}
                  </AcrSelect.Item>
                ))}
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>

          {/* Drive Filter */}
          <div>
            <AcrLabel>Drive</AcrLabel>
            <AcrSelect.Root
              value={searchTerms.drive_type}
              onValueChange={(value) =>
                setSearchTerms({ ...searchTerms, drive_type: value })
              }
              disabled={isLoading}
            >
              <AcrSelect.Trigger variant={isLoading ? "disabled" : "default"}>
                <AcrSelect.Value
                  placeholder={
                    isLoading ? "Loading..." : t("common.actions.all")
                  }
                />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="__all__">
                  {t("common.actions.all")}
                </AcrSelect.Item>
                {filterOptions?.drive_types.map((drive) => (
                  <AcrSelect.Item key={drive} value={drive}>
                    {drive}
                  </AcrSelect.Item>
                ))}
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>

          {/* Bolt Pattern Filter */}
          <div>
            <AcrLabel>Bolt Pattern</AcrLabel>
            <AcrSelect.Root
              value={searchTerms.bolt_pattern}
              onValueChange={(value) =>
                setSearchTerms({ ...searchTerms, bolt_pattern: value })
              }
              disabled={isLoading}
            >
              <AcrSelect.Trigger variant={isLoading ? "disabled" : "default"}>
                <AcrSelect.Value
                  placeholder={
                    isLoading ? "Loading..." : t("common.actions.all")
                  }
                />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="__all__">
                  {t("common.actions.all")}
                </AcrSelect.Item>
                {filterOptions?.bolt_patterns.map((pattern) => (
                  <AcrSelect.Item key={pattern} value={pattern}>
                    {pattern}
                  </AcrSelect.Item>
                ))}
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>
        </div>

        {/* Clear Filters Button - Desktop */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-2">
            <AcrButton
              onClick={clearAllFilters}
              variant="ghost"
              className="text-acr-red-600 bg-acr-red-50 border border-acr-red-200 hover:bg-acr-red-100"
            >
              {t("common.actions.clearFilters")}
            </AcrButton>
          </div>
        )}
      </div>
    </div>
  );
}
