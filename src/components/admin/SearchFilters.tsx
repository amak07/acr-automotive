"use client";

import { Dispatch, SetStateAction } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Search, XCircleIcon } from "lucide-react";
import { AdminPartsQueryParams } from "@/types";
import { useFilterOptions } from "@/hooks/useFilterOptions";

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
  const { data: filterOptions, isLoading, error } = useFilterOptions();

  return (
    <div className="bg-white p-4 rounded-lg border border-acr-gray-200 shadow-sm mb-6 lg:p-6">
      {/* Mobile: Stacked Layout */}
      <div className="lg:hidden space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-acr-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder={t("admin.search.placeholder")}
            value={searchTerms.search}
            onChange={(e) =>
              setSearchTerms({ ...searchTerms, search: e.target.value })
            }
            className="w-full pl-10 pr-10 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent text-sm"
          />
          {searchTerms.search && (
            <button
              onClick={() => setSearchTerms({ ...searchTerms, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-acr-gray-400 hover:text-acr-gray-600 transition-colors"
            >
              <XCircleIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <select
            value={searchTerms.part_type}
            onChange={(e) => setSearchTerms({ ...searchTerms, part_type: e.target.value })}
            disabled={isLoading}
            className="pl-4 pr-8 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent text-sm bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px'
            }}
          >
            <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
            {filterOptions?.part_types.map((partType) => (
              <option key={partType} value={partType}>
                {partType}
              </option>
            ))}
          </select>

          <select
            value={searchTerms.position_type}
            onChange={(e) => setSearchTerms({ ...searchTerms, position_type: e.target.value })}
            disabled={isLoading}
            className="pl-4 pr-8 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent text-sm bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px'
            }}
          >
            <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
            {filterOptions?.position_types.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>

          <select
            value={searchTerms.abs_type}
            onChange={(e) => setSearchTerms({ ...searchTerms, abs_type: e.target.value })}
            disabled={isLoading}
            className="pl-4 pr-8 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent text-sm bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px'
            }}
          >
            <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
            {filterOptions?.abs_types.map((abs) => (
              <option key={abs} value={abs}>
                {abs}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            value={searchTerms.drive_type}
            onChange={(e) => setSearchTerms({ ...searchTerms, drive_type: e.target.value })}
            disabled={isLoading}
            className="pl-4 pr-8 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent text-sm bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px'
            }}
          >
            <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
            {filterOptions?.drive_types.map((drive) => (
              <option key={drive} value={drive}>
                {drive}
              </option>
            ))}
          </select>

          <select
            value={searchTerms.bolt_pattern}
            onChange={(e) => setSearchTerms({ ...searchTerms, bolt_pattern: e.target.value })}
            disabled={isLoading}
            className="pl-4 pr-8 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent text-sm bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px'
            }}
          >
            <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
            {filterOptions?.bolt_patterns.map((pattern) => (
              <option key={pattern} value={pattern}>
                {pattern}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop: Two-row Layout */}
      <div className="hidden lg:block space-y-4">
        {/* Top Row: Search (2/3) + Part Type (1/3) */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-acr-gray-700 mb-2">
              {t("admin.search.button")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-acr-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder={t("admin.search.placeholder")}
                value={searchTerms.search}
                onChange={(e) =>
                  setSearchTerms({ ...searchTerms, search: e.target.value })
                }
                className="w-full pl-10 pr-10 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent"
              />
              {searchTerms.search && (
                <button
                  onClick={() => setSearchTerms({ ...searchTerms, search: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-acr-gray-400 hover:text-acr-gray-600 transition-colors"
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="w-1/3">
            <label className="block text-sm font-medium text-acr-gray-700 mb-2">
              {t("admin.search.partType")}
            </label>
            <select
              value={searchTerms.part_type}
              onChange={(e) => setSearchTerms({ ...searchTerms, part_type: e.target.value })}
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "16px",
              }}
            >
              <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
              {filterOptions?.part_types.map((partType) => (
                <option key={partType} value={partType}>
                  {partType}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom Row: 4 remaining filters equally spaced */}
        <div className="grid grid-cols-4 gap-4">
          {/* Position Filter */}
          <div>
            <label className="block text-sm font-medium text-acr-gray-700 mb-2">
              {t("admin.search.position")}
            </label>
            <select
              value={searchTerms.position_type}
              onChange={(e) => setSearchTerms({ ...searchTerms, position_type: e.target.value })}
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "16px",
              }}
            >
              <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
              {filterOptions?.position_types.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          {/* ABS Filter */}
          <div>
            <label className="block text-sm font-medium text-acr-gray-700 mb-2">
              ABS
            </label>
            <select
              value={searchTerms.abs_type}
              onChange={(e) => setSearchTerms({ ...searchTerms, abs_type: e.target.value })}
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "16px",
              }}
            >
              <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
              {filterOptions?.abs_types.map((abs) => (
                <option key={abs} value={abs}>
                  {abs}
                </option>
              ))}
            </select>
          </div>

          {/* Drive Filter */}
          <div>
            <label className="block text-sm font-medium text-acr-gray-700 mb-2">
              Drive
            </label>
            <select
              value={searchTerms.drive_type}
              onChange={(e) => setSearchTerms({ ...searchTerms, drive_type: e.target.value })}
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "16px",
              }}
            >
              <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
              {filterOptions?.drive_types.map((drive) => (
                <option key={drive} value={drive}>
                  {drive}
                </option>
              ))}
            </select>
          </div>

          {/* Bolt Pattern Filter */}
          <div>
            <label className="block text-sm font-medium text-acr-gray-700 mb-2">
              Bolt Pattern
            </label>
            <select
              value={searchTerms.bolt_pattern}
              onChange={(e) => setSearchTerms({ ...searchTerms, bolt_pattern: e.target.value })}
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "16px",
              }}
            >
              <option value="">{isLoading ? 'Loading...' : t('common.actions.all')}</option>
              {filterOptions?.bolt_patterns.map((pattern) => (
                <option key={pattern} value={pattern}>
                  {pattern}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
