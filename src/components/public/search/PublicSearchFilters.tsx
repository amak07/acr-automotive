"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Car, Package } from "lucide-react";
import { AcrButton, AcrTabs, AcrTabsList, AcrTabsTrigger, AcrTabsContent } from "@/components/acr";
import { AcrComboBox } from "@/components/acr/ComboBox";
import { useLocale } from "@/contexts/LocaleContext";
import { useVehicleOptions } from "@/hooks";
import { CardError } from "@/components/ui/error-states";
import { DEFAULT_PUBLIC_SEARCH_TERMS } from "@/app/constants";

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
  setSearchTerms: Dispatch<SetStateAction<PublicSearchTerms>>;
};

export function PublicSearchFilters(props: PublicSearchFiltersProps) {
  const { setSearchTerms } = props;
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("vehicle");
  const { data, isLoading, error } = useVehicleOptions();

  // dropdown list options.
  const [models, setModels] = useState<string[] | undefined>();
  const [years, setYears] = useState<number[] | undefined>();

  // selected options for SearchTerms - initialize from URL
  const [selectedMake, setSelectedMake] = useState<string>(searchParams?.get('make') || "");
  const [selectedModel, setSelectedModel] = useState<string>(searchParams?.get('model') || "");
  const [selectedYear, setSelectedYear] = useState<string>(searchParams?.get('year') || "");

  // for SKU term lookup - initialize from URL
  const [skuTerm, setSkuTerm] = useState<string>(searchParams?.get('sku') || "");

  // Sync internal state with URL params when they change (browser back/forward)
  useEffect(() => {
    setSelectedMake(searchParams?.get('make') || "");
    setSelectedModel(searchParams?.get('model') || "");
    setSelectedYear(searchParams?.get('year') || "");
    setSkuTerm(searchParams?.get('sku') || "");
  }, [searchParams]);

  useEffect(() => {
    if (selectedMake && data?.models) {
      setModels(data.models[selectedMake]);
    }
  }, [selectedMake, data?.models]);

  useEffect(() => {
    if (selectedModel && selectedMake && data?.years) {
      setYears(data.years[`${selectedMake}-${selectedModel}`]);
    }
  }, [selectedModel, selectedMake, data?.years]);

  const handleVehicleSearch = () => {
    if (selectedMake && selectedModel && selectedYear) {
      setSearchTerms({
        make: selectedMake,
        model: selectedModel,
        year: selectedYear,
        offset: 0,
        limit: 15,
        sku_term: "",
      });
    }
  };

  const handleSkuTermSearch = () => {
    if (skuTerm) {
      setSearchTerms({
        offset: 0,
        limit: 15,
        sku_term: skuTerm,
        make: "",
        model: "",
        year: "",
      });
    }
  };

  const clearAllFilters = () => {
    setSelectedMake("");
    setSelectedModel("");
    setSelectedYear("");
    setSkuTerm("");
    setSearchTerms(DEFAULT_PUBLIC_SEARCH_TERMS);
  };

  const hasActiveFilters = selectedMake || selectedModel || selectedYear || skuTerm;

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

  return (
    <div className="bg-white p-3 rounded-lg border border-acr-gray-300 shadow-md lg:p-4">
      <AcrTabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab Headers with "Search By" Label on Top (Mobile) */}
        <div className="space-y-2 mb-4 lg:space-y-0 lg:mb-0">
          <span className="block text-sm font-semibold text-acr-gray-900 lg:hidden">
            {t("common.actions.searchBy")}
          </span>
          <AcrTabsList>
            <AcrTabsTrigger value="vehicle">
              <Car className="w-4 h-4 mr-1.5 hidden lg:inline" />
              <span className="lg:hidden">{t("public.search.vehicleTabShort")}</span>
              <span className="hidden lg:inline">{t("public.search.vehicleSearchTitle")}</span>
            </AcrTabsTrigger>
            <AcrTabsTrigger value="sku">
              <Package className="w-4 h-4 mr-1.5 hidden lg:inline" />
              <span className="lg:hidden">{t("public.search.skuTabShort")}</span>
              <span className="hidden lg:inline">{t("public.search.skuSearchTitle")}</span>
            </AcrTabsTrigger>
          </AcrTabsList>
        </div>

        {/* Vehicle Search Tab Content */}
        <AcrTabsContent value="vehicle">

        {/* Mobile & Tablet: Stacked Layout */}
        <div className="md:hidden space-y-3">
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
            className="w-full h-12 mt-2"
            onClick={handleVehicleSearch}
            disabled={
              !selectedMake || !selectedModel || !selectedYear || isLoading
            }
          >
            {t("common.actions.search")}
          </AcrButton>

          {/* Clear Filters Button - Mobile */}
          {hasActiveFilters && (
            <AcrButton
              onClick={clearAllFilters}
              variant="ghost"
              className="w-full text-acr-red-600 bg-acr-red-50 border border-acr-red-200 hover:bg-acr-red-100 mt-2"
            >
              {t("common.actions.clearFilters")}
            </AcrButton>
          )}
        </div>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden md:flex md:items-center md:gap-4">
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
            className="whitespace-nowrap h-auto py-3"
            onClick={handleVehicleSearch}
            disabled={
              !selectedMake || !selectedModel || !selectedYear || isLoading
            }
          >
            {t("common.actions.search")}
          </AcrButton>

          {/* Clear Filters Button - Desktop (inline with Search) */}
          {hasActiveFilters && (
            <AcrButton
              onClick={clearAllFilters}
              variant="ghost"
              className="hidden md:inline-flex whitespace-nowrap h-auto py-3 text-acr-red-600 bg-acr-red-50 border border-acr-red-200 hover:bg-acr-red-100"
            >
              {t("common.actions.clearFilters")}
            </AcrButton>
          )}
        </div>
        </AcrTabsContent>

        {/* SKU Search Tab Content */}
        <AcrTabsContent value="sku">

            {/* Mobile: Stacked Layout */}
            <div className="md:hidden space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-acr-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={skuTerm}
                  onChange={(e) => setSkuTerm(e.target.value)}
                  placeholder={t("public.search.skuPlaceholder")}
                  className="w-full h-12 pl-10 pr-4 py-3 border border-acr-gray-400 rounded-lg focus:outline-none focus:border-acr-red-500 placeholder:text-acr-gray-500 transition-colors duration-200"
                />
              </div>

              <AcrButton
                className="w-full h-12"
                onClick={handleSkuTermSearch}
                disabled={!skuTerm}
              >
                {t("common.actions.search")}
              </AcrButton>
            </div>

            {/* Desktop: Horizontal Layout */}
            <div className="hidden md:flex md:items-center md:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-acr-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={skuTerm}
                  onChange={(e) => setSkuTerm(e.target.value)}
                  placeholder={t("public.search.skuPlaceholder")}
                  className="w-full pl-10 pr-4 py-3 border border-acr-gray-400 rounded-lg focus:outline-none focus:border-acr-red-500 placeholder:text-acr-gray-500 transition-colors duration-200"
                />
              </div>

              <AcrButton
                className="whitespace-nowrap h-auto py-3"
                onClick={handleSkuTermSearch}
                disabled={!skuTerm}
              >
                {t("common.actions.search")}
              </AcrButton>

              {/* Clear Filters Button - Desktop (inline with Search) */}
              {hasActiveFilters && (
                <AcrButton
                  onClick={clearAllFilters}
                  variant="ghost"
                  className="whitespace-nowrap h-auto py-3 text-acr-red-600 bg-acr-red-50 border border-acr-red-200 hover:bg-acr-red-100"
                >
                  {t("common.actions.clearFilters")}
                </AcrButton>
              )}
            </div>

          {/* Clear Filters Button - Mobile (full width below) */}
          {hasActiveFilters && (
            <AcrButton
              onClick={clearAllFilters}
              variant="ghost"
              className="md:hidden w-full text-acr-red-600 bg-acr-red-50 border border-acr-red-200 hover:bg-acr-red-100 mt-3"
            >
              {t("common.actions.clearFilters")}
            </AcrButton>
          )}
        </AcrTabsContent>
      </AcrTabs>
    </div>
  );
}
