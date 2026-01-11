"use client";

import * as React from "react";
import { AcrButton, AcrSelect } from "@/components/acr";
import { useLocale } from "@/contexts/LocaleContext";
import { SearchTerms } from "./SearchFilters";
import { X } from "lucide-react";

interface FilterPanelProps {
  searchTerms: SearchTerms;
  onApply: (terms: SearchTerms) => void;
  onClear: () => void;
  onClose?: () => void;
  filterOptions: {
    partTypes: { value: string; label: string }[];
    positionTypes: { value: string; label: string }[];
    absTypes: { value: string; label: string }[];
    driveTypes: { value: string; label: string }[];
    boltPatterns: { value: string; label: string }[];
  };
}

export function FilterPanel({
  searchTerms,
  onApply,
  onClear,
  onClose,
  filterOptions,
}: FilterPanelProps) {
  const { t } = useLocale();
  const [localTerms, setLocalTerms] = React.useState<SearchTerms>(searchTerms);

  // Update local state when searchTerms prop changes
  React.useEffect(() => {
    setLocalTerms(searchTerms);
  }, [searchTerms]);

  const handleApply = () => {
    onApply(localTerms);
    onClose?.();
  };

  const handleClear = () => {
    const clearedTerms: SearchTerms = {
      search: searchTerms.search, // Keep search term
      part_type: "__all__",
      position_type: "__all__",
      abs_type: "__all__",
      drive_type: "__all__",
      bolt_pattern: "__all__",
    };
    setLocalTerms(clearedTerms);
    onClear();
    onClose?.();
  };

  const updateFilter = (key: keyof SearchTerms, value: string) => {
    setLocalTerms((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white border border-acr-gray-200 rounded-xl p-6 acr-animate-slide-down">
      {/* Mobile Close Button */}
      {onClose && (
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h3 className="text-lg font-semibold text-acr-gray-900">
            {t("admin.filters.toggle")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-acr-gray-100 rounded-lg transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Part Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-acr-gray-700">
            {t("admin.search.partType")}
          </label>
          <AcrSelect.Root
            value={localTerms.part_type}
            onValueChange={(value) => updateFilter("part_type", value)}
          >
            <AcrSelect.Trigger>
              <AcrSelect.Value placeholder={t("common.actions.all")} />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions.partTypes.map((option) => (
                <AcrSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>
        </div>

        {/* Position Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-acr-gray-700">
            {t("admin.search.position")}
          </label>
          <AcrSelect.Root
            value={localTerms.position_type}
            onValueChange={(value) => updateFilter("position_type", value)}
          >
            <AcrSelect.Trigger>
              <AcrSelect.Value placeholder={t("common.actions.all")} />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions.positionTypes.map((option) => (
                <AcrSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>
        </div>

        {/* ABS Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-acr-gray-700">
            {t("admin.parts.abs")}
          </label>
          <AcrSelect.Root
            value={localTerms.abs_type}
            onValueChange={(value) => updateFilter("abs_type", value)}
          >
            <AcrSelect.Trigger>
              <AcrSelect.Value placeholder={t("common.actions.all")} />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions.absTypes.map((option) => (
                <AcrSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>
        </div>

        {/* Drive Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-acr-gray-700">
            {t("partDetails.basicInfo.driveType")}
          </label>
          <AcrSelect.Root
            value={localTerms.drive_type}
            onValueChange={(value) => updateFilter("drive_type", value)}
          >
            <AcrSelect.Trigger>
              <AcrSelect.Value placeholder={t("common.actions.all")} />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions.driveTypes.map((option) => (
                <AcrSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>
        </div>

        {/* Bolt Pattern */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-acr-gray-700">
            {t("partDetails.basicInfo.boltPattern")}
          </label>
          <AcrSelect.Root
            value={localTerms.bolt_pattern}
            onValueChange={(value) => updateFilter("bolt_pattern", value)}
          >
            <AcrSelect.Trigger>
              <AcrSelect.Value placeholder={t("common.actions.all")} />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="__all__">
                {t("common.actions.all")}
              </AcrSelect.Item>
              {filterOptions.boltPatterns.map((option) => (
                <AcrSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <AcrButton
          variant="secondary"
          onClick={handleClear}
          className="w-full sm:w-auto"
        >
          {t("admin.filters.clearFilters")}
        </AcrButton>
        <AcrButton
          variant="primary"
          onClick={handleApply}
          className="w-full sm:w-auto"
        >
          {t("admin.filters.applyFilters")}
        </AcrButton>
      </div>
    </div>
  );
}
