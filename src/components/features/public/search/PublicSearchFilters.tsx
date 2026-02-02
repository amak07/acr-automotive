"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Car, Package } from "lucide-react";
import {
  AcrButton,
  AcrTabs,
  AcrTabsList,
  AcrTabsTrigger,
  AcrTabsContent,
} from "@/components/acr";
import { AcrComboBox } from "@/components/acr/ComboBox";
import { useLocale } from "@/contexts/LocaleContext";
import { useVehicleOptions } from "@/hooks";
import { CardError } from "@/components/ui/error-states";
import { DEFAULT_PUBLIC_SEARCH_TERMS } from "@/app/constants";
import { cn } from "@/lib/utils";

export type PublicSearchTerms = {
  limit: number;
  offset: number;
  // Vehicle search
  make: string;
  model: string;
  year: string;
  // ACR Sku or Competitor Sku cross reference lookup
  sku_term: string;
};

type PublicSearchFiltersProps = {
  setSearchTerms: (terms: PublicSearchTerms) => void;
};

export function PublicSearchFilters(props: PublicSearchFiltersProps) {
  const { setSearchTerms } = props;
  const { t } = useLocale();
  const searchParams = useSearchParams();

  // Determine initial active tab based on URL params
  const getInitialTab = () => {
    const skuParam = searchParams?.get("sku");

    // SKU search takes precedence if present
    if (skuParam) return "sku";
    // Vehicle params switch to vehicle tab
    if (searchParams?.get("make")) return "vehicle";
    // Default to Quick Search tab
    return "sku";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const { data, isLoading, error } = useVehicleOptions();

  // selected options for SearchTerms - initialize from URL
  const [selectedMake, setSelectedMake] = useState<string>(
    searchParams?.get("make") || ""
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    searchParams?.get("model") || ""
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    searchParams?.get("year") || ""
  );

  // for SKU term lookup - initialize from URL
  const [skuTerm, setSkuTerm] = useState<string>(
    searchParams?.get("sku") || ""
  );

  // Derive dropdown options from data + selected values (no setState in effects)
  const models = useMemo(() => {
    if (selectedMake && data?.models) {
      return data.models[selectedMake];
    }
    return undefined;
  }, [selectedMake, data?.models]);

  const years = useMemo(() => {
    if (selectedModel && selectedMake && data?.years) {
      return data.years[`${selectedMake}-${selectedModel}`];
    }
    return undefined;
  }, [selectedModel, selectedMake, data?.years]);

  // Sync internal state with URL params when they change (browser back/forward)
  // Using a ref to track previous values to avoid unnecessary re-renders
  useEffect(() => {
    const makeParam = searchParams?.get("make") || "";
    const modelParam = searchParams?.get("model") || "";
    const yearParam = searchParams?.get("year") || "";
    const skuParam = searchParams?.get("sku") || "";

    // Only update if values actually changed (prevents cascading renders)
    if (makeParam !== selectedMake) setSelectedMake(makeParam);
    if (modelParam !== selectedModel) setSelectedModel(modelParam);
    if (yearParam !== selectedYear) setSelectedYear(yearParam);
    if (skuParam !== skuTerm) setSkuTerm(skuParam);

    // Update active tab based on which search type has params
    if (skuParam) {
      setActiveTab("sku");
    } else if (makeParam) {
      setActiveTab("vehicle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleVehicleSearch = () => {
    if (selectedMake && selectedModel && selectedYear) {
      // Clear SKU when doing vehicle search
      setSkuTerm("");
      setSearchTerms({
        make: selectedMake,
        model: selectedModel,
        year: selectedYear,
        offset: 0,
        limit: 15,
        sku_term: "", // Clear SKU search
      });
    }
  };

  const handleSkuTermSearch = () => {
    if (skuTerm) {
      // Clear vehicle filters when doing SKU search
      setSelectedMake("");
      setSelectedModel("");
      setSelectedYear("");
      setSearchTerms({
        offset: 0,
        limit: 15,
        sku_term: skuTerm,
        make: "", // Clear vehicle search
        model: "",
        year: "",
      });
    }
  };

  // Keyboard handlers for Enter key
  const handleVehicleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Only trigger search if Enter is pressed on a non-interactive element
      // This prevents interfering with combobox keyboard navigation
      const target = e.target as HTMLElement;
      const isComboboxOrInput =
        target.tagName === "INPUT" ||
        target.role === "combobox" ||
        target.closest('[role="combobox"]');

      if (!isComboboxOrInput) {
        e.preventDefault();
        handleVehicleSearch();
      }
    }
  };

  const handleSkuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSkuTermSearch();
    }
  };

  const clearAllFilters = () => {
    // Only clear filters for the active tab
    if (activeTab === "vehicle") {
      setSelectedMake("");
      setSelectedModel("");
      setSelectedYear("");
      // Clear vehicle search, preserve SKU if on different tab
      setSearchTerms({
        ...DEFAULT_PUBLIC_SEARCH_TERMS,
        sku_term: "", // Clear any SKU search too when clearing from vehicle tab
      });
    } else {
      setSkuTerm("");
      // Clear SKU search, preserve vehicle if on different tab
      setSearchTerms({
        ...DEFAULT_PUBLIC_SEARCH_TERMS,
        make: "",
        model: "",
        year: "",
      });
    }
  };

  // Check if current tab has active filters
  const hasActiveFilters =
    activeTab === "vehicle"
      ? selectedMake || selectedModel || selectedYear
      : skuTerm;

  // Show error state if vehicle options failed to load
  if (error) {
    return (
      <div className="space-y-4">
        <CardError
          title={t("public.search.errorTitle")}
          message={t("public.search.errorMessage")}
          className="p-3 lg:p-4"
        />
      </div>
    );
  }

  // Check if vehicle search is ready (all fields filled)
  const isVehicleSearchReady =
    activeTab === "vehicle" && selectedMake && selectedModel && selectedYear;
  const isSkuSearchReady = activeTab === "sku" && skuTerm.length > 0;
  const isSearchReady = isVehicleSearchReady || isSkuSearchReady;

  return (
    <div className="bg-white p-3 rounded-lg border border-acr-gray-300 shadow-md lg:p-4">
      <AcrTabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab Headers with "Search By" Label on Top (Mobile) */}
        <div className="space-y-2 mb-4 lg:space-y-0 lg:mb-0">
          <span className="block text-sm font-semibold text-acr-gray-900 lg:hidden">
            {t("common.actions.searchBy")}
          </span>
          <AcrTabsList>
            <AcrTabsTrigger value="sku">
              <Package className="w-4 h-4 mr-1.5 hidden lg:inline" />
              <span className="lg:hidden">
                {t("public.search.skuTabShort")}
              </span>
              <span className="hidden lg:inline">
                {t("public.search.skuSearchTitle")}
              </span>
            </AcrTabsTrigger>
            <AcrTabsTrigger value="vehicle">
              <Car className="w-4 h-4 mr-1.5 hidden lg:inline" />
              <span className="lg:hidden">
                {t("public.search.vehicleTabShort")}
              </span>
              <span className="hidden lg:inline">
                {t("public.search.vehicleSearchTitle")}
              </span>
            </AcrTabsTrigger>
          </AcrTabsList>
        </div>

        {/* Vehicle Search Tab Content */}
        <AcrTabsContent value="vehicle">
          {/* Mobile & Tablet: Stacked Layout (up to lg breakpoint for better iPad experience) */}
          <div className="lg:hidden space-y-3" onKeyDown={handleVehicleKeyDown}>
            <AcrComboBox
              value={selectedMake}
              onValueChange={(value) => {
                setSelectedMake(value);
                setSelectedModel("");
                setSelectedYear("");
              }}
              options={
                isLoading
                  ? []
                  : data?.makes.map((make) => ({
                      label: make,
                      value: make,
                    })) || []
              }
              placeholder={
                isLoading
                  ? t("public.search.loadingOptions")
                  : t("public.search.make")
              }
              searchPlaceholder="Search makes..."
              allowCustomValue={false}
              isLoading={isLoading}
              className="w-full h-12"
            />

            <AcrComboBox
              value={selectedModel}
              onValueChange={(value) => {
                setSelectedModel(value);
                setSelectedYear("");
              }}
              options={
                !selectedMake || isLoading
                  ? []
                  : models?.map((model) => ({
                      label: model,
                      value: model,
                    })) || []
              }
              placeholder={
                !selectedMake
                  ? t("public.search.selectMakeFirst")
                  : isLoading
                    ? t("public.search.loadingOptions")
                    : models?.length === 0
                      ? t("public.search.noModelsAvailable")
                      : t("public.search.model")
              }
              searchPlaceholder="Search models..."
              allowCustomValue={false}
              disabled={!selectedMake || isLoading}
              isLoading={isLoading && !selectedMake}
              className="w-full h-12"
            />

            <AcrComboBox
              value={selectedYear}
              onValueChange={(value) => setSelectedYear(value)}
              options={
                !selectedModel || isLoading
                  ? []
                  : years?.map((year) => ({
                      label: year.toString(),
                      value: year.toString(),
                    })) || []
              }
              placeholder={
                !selectedModel
                  ? t("public.search.selectModelFirst")
                  : isLoading
                    ? t("public.search.loadingOptions")
                    : years?.length === 0
                      ? t("public.search.noYearsAvailable")
                      : t("public.search.year")
              }
              searchPlaceholder="Search years..."
              allowCustomValue={false}
              disabled={!selectedModel || isLoading}
              isLoading={isLoading && !selectedModel}
              className="w-full h-12"
            />

            <AcrButton
              className={cn(
                "w-full h-12 mt-2",
                isVehicleSearchReady && "acr-pulse-ready"
              )}
              onClick={handleVehicleSearch}
              disabled={
                !selectedMake || !selectedModel || !selectedYear || isLoading
              }
            >
              {t("common.actions.search")}
            </AcrButton>

            {/* Clear Filters - Mobile */}
            {hasActiveFilters && (
              <AcrButton
                onClick={clearAllFilters}
                variant="secondary"
                className="w-full mt-2"
              >
                {t("common.actions.clearFilters")}
              </AcrButton>
            )}
          </div>

          {/* Desktop: Horizontal Layout (lg and up) */}
          <div
            className="hidden lg:flex lg:items-center lg:gap-4"
            onKeyDown={handleVehicleKeyDown}
          >
            <AcrComboBox
              value={selectedMake}
              onValueChange={(value) => {
                setSelectedMake(value);
                setSelectedModel("");
                setSelectedYear("");
              }}
              options={
                isLoading
                  ? []
                  : data?.makes.map((make) => ({
                      label: make,
                      value: make,
                    })) || []
              }
              placeholder={
                isLoading
                  ? t("public.search.loadingOptions")
                  : t("public.search.make")
              }
              searchPlaceholder="Search makes..."
              allowCustomValue={false}
              isLoading={isLoading}
              className="flex-1"
            />

            <AcrComboBox
              value={selectedModel}
              onValueChange={(value) => {
                setSelectedModel(value);
                setSelectedYear("");
              }}
              options={
                !selectedMake || isLoading
                  ? []
                  : models?.map((model) => ({
                      label: model,
                      value: model,
                    })) || []
              }
              placeholder={
                !selectedMake
                  ? t("public.search.selectMakeFirst")
                  : isLoading
                    ? t("public.search.loadingOptions")
                    : models?.length === 0
                      ? t("public.search.noModelsAvailable")
                      : t("public.search.model")
              }
              searchPlaceholder="Search models..."
              allowCustomValue={false}
              disabled={!selectedMake || isLoading}
              isLoading={isLoading && !selectedMake}
              className="flex-1"
            />

            <AcrComboBox
              value={selectedYear}
              onValueChange={(value) => setSelectedYear(value)}
              options={
                !selectedModel || isLoading
                  ? []
                  : years?.map((year) => ({
                      label: year.toString(),
                      value: year.toString(),
                    })) || []
              }
              placeholder={
                !selectedModel
                  ? t("public.search.selectModelFirst")
                  : isLoading
                    ? t("public.search.loadingOptions")
                    : years?.length === 0
                      ? t("public.search.noYearsAvailable")
                      : t("public.search.year")
              }
              searchPlaceholder="Search years..."
              allowCustomValue={false}
              disabled={!selectedModel || isLoading}
              isLoading={isLoading && !selectedModel}
              className="flex-1"
            />

            <AcrButton
              className={cn(
                "whitespace-nowrap h-auto py-3",
                isVehicleSearchReady && "acr-pulse-ready"
              )}
              onClick={handleVehicleSearch}
              disabled={
                !selectedMake || !selectedModel || !selectedYear || isLoading
              }
            >
              {t("common.actions.search")}
            </AcrButton>

            {/* Clear Filters - Desktop */}
            {hasActiveFilters && (
              <AcrButton
                onClick={clearAllFilters}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {t("common.actions.clearFilters")}
              </AcrButton>
            )}
          </div>
        </AcrTabsContent>

        {/* SKU Search Tab Content */}
        <AcrTabsContent value="sku">
          {/* Mobile & Tablet: Stacked Layout */}
          <div className="lg:hidden space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-acr-gray-500 w-4 h-4" />
              <input
                type="text"
                value={skuTerm}
                onChange={(e) => setSkuTerm(e.target.value)}
                onKeyDown={handleSkuKeyDown}
                placeholder={t("public.search.skuPlaceholder")}
                className="w-full h-12 pl-10 pr-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 placeholder:text-acr-gray-500 transition-all duration-200"
              />
            </div>

            <AcrButton
              className={cn(
                "w-full h-12",
                isSkuSearchReady && "acr-pulse-ready"
              )}
              onClick={handleSkuTermSearch}
              disabled={!skuTerm}
            >
              {t("common.actions.search")}
            </AcrButton>
          </div>

          {/* Desktop: Horizontal Layout (lg and up) */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-acr-gray-500 w-4 h-4" />
              <input
                type="text"
                value={skuTerm}
                onChange={(e) => setSkuTerm(e.target.value)}
                onKeyDown={handleSkuKeyDown}
                placeholder={t("public.search.skuPlaceholder")}
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 placeholder:text-acr-gray-500 transition-all duration-200"
              />
            </div>

            <AcrButton
              className={cn(
                "whitespace-nowrap h-auto py-3",
                isSkuSearchReady && "acr-pulse-ready"
              )}
              onClick={handleSkuTermSearch}
              disabled={!skuTerm}
            >
              {t("common.actions.search")}
            </AcrButton>

            {/* Clear Filters - Desktop */}
            {hasActiveFilters && (
              <AcrButton
                onClick={clearAllFilters}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {t("common.actions.clearFilters")}
              </AcrButton>
            )}
          </div>

          {/* Clear Filters - Mobile & Tablet */}
          {hasActiveFilters && (
            <AcrButton
              onClick={clearAllFilters}
              variant="secondary"
              className="lg:hidden w-full mt-3"
            >
              {t("common.actions.clearFilters")}
            </AcrButton>
          )}
        </AcrTabsContent>
      </AcrTabs>
    </div>
  );
}
