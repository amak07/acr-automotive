"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Search, XCircleIcon, ChevronDown, ChevronUp } from "lucide-react";
import { AcrButton } from "@/components/acr/Button";
import { AcrSelect } from "@/components/acr/Select";
import { useLocale } from "@/contexts/LocaleContext";
import { useVehicleOptions } from "@/hooks";

export type PublicSearchTerms = {
  // Vehicle search
  make: string;
  model: string;
  year: string;
  // ACR Sku or Competitor Sku cross reference lookup
  sku_term: string;
  limit: number;
  offset: number;
};

type PublicSearchFiltersProps = {
  searchTerms: PublicSearchTerms;
  setSearchTerms: Dispatch<SetStateAction<PublicSearchTerms>>;
};

export function PublicSearchFilters(props: PublicSearchFiltersProps) {
  const { searchTerms, setSearchTerms } = props;
  const { t } = useLocale();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { data, isLoading, error } = useVehicleOptions();

  // dropdown list options.
  const [models, setModels] = useState<string[] | undefined>();
  const [years, setYears] = useState<number[] | undefined>();

  // selected options for SearchTerms.
  const [selectedMake, setSelectedMake] = useState<string>();
  const [selectedModel, setSelectedModel] = useState<string>();
  const [selectedYear, setSelectedYear] = useState<string>();

  useEffect(() => {
    if (selectedMake) {
      setModels(data?.models[selectedMake]);
    }
  }, [selectedMake]);

  useEffect(() => {
    if (selectedModel) {
      setYears(data?.years[`${selectedMake}-${selectedModel}`]);
    }
  }, [selectedModel]);

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

  // Show error state if vehicle options failed to load
  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-3 rounded-lg border border-red-300 shadow-md lg:p-4">
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Vehicle Options</h3>
            <p className="text-red-600 text-sm">Please try refreshing the page or contact support if the problem persists.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vehicle Search Section */}
      <div className="bg-white p-3 rounded-lg border border-acr-gray-300 shadow-md lg:p-4">
        <h3 className="text-lg font-semibold text-acr-gray-900 mb-3">
          {t("public.search.vehicleSearchTitle")}
        </h3>

        {/* Mobile & Tablet: Stacked Layout */}
        <div className="md:hidden space-y-3">
          <AcrSelect.Root
            value={selectedMake}
            onValueChange={(value) => {
              setSelectedMake(value);
              setSelectedModel(undefined);
              setSelectedYear(undefined);
            }}
            isLoading={isLoading}
          >
            <AcrSelect.Trigger className="w-full h-12">
              <AcrSelect.Value placeholder={
                isLoading ? t("public.search.loadingOptions") : t("public.search.make")
              } />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              {data?.makes.map((make) => (
                <AcrSelect.Item key={make} value={make}>
                  {make}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={selectedModel}
            onValueChange={(value) => {
              setSelectedModel(value);
              setSelectedYear(undefined);
            }}
            disabled={!selectedMake || isLoading}
            isLoading={isLoading && !selectedMake}
          >
            <AcrSelect.Trigger className="w-full h-12">
              <AcrSelect.Value placeholder={
                !selectedMake
                  ? t("public.search.selectMakeFirst")
                  : isLoading
                    ? t("public.search.loadingOptions")
                    : models?.length === 0
                      ? t("public.search.noModelsAvailable")
                      : t("public.search.model")
              } />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              {selectedMake && models?.map((model) => (
                <AcrSelect.Item key={model} value={model}>
                  {model}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={selectedYear}
            onValueChange={(value) => setSelectedYear(value)}
            disabled={!selectedModel || isLoading}
            isLoading={isLoading && !selectedModel}
          >
            <AcrSelect.Trigger className="w-full h-12">
              <AcrSelect.Value placeholder={
                !selectedModel
                  ? t("public.search.selectModelFirst")
                  : isLoading
                    ? t("public.search.loadingOptions")
                    : years?.length === 0
                      ? t("public.search.noYearsAvailable")
                      : t("public.search.year")
              } />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              {selectedModel && years?.map((year) => (
                <AcrSelect.Item key={year} value={year.toString()}>
                  {year}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrButton
            className="w-full h-12 mt-2"
            onClick={handleVehicleSearch}
            disabled={!selectedMake || !selectedModel || !selectedYear || isLoading}
          >
            {isLoading ? t("public.search.loadingOptions") : t("public.search.button")}
          </AcrButton>
        </div>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <AcrSelect.Root
            value={selectedMake}
            onValueChange={(value) => {
              setSelectedMake(value);
              setSelectedModel(undefined);
              setSelectedYear(undefined);
            }}
            isLoading={isLoading}
          >
            <AcrSelect.Trigger className="flex-1">
              <AcrSelect.Value placeholder={
                isLoading ? t("public.search.loadingOptions") : t("public.search.make")
              } />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              {data?.makes.map((make) => (
                <AcrSelect.Item key={make} value={make}>
                  {make}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={selectedModel}
            onValueChange={(value) => {
              setSelectedModel(value);
              setSelectedYear(undefined);
            }}
            disabled={!selectedMake || isLoading}
            isLoading={isLoading && !selectedMake}
          >
            <AcrSelect.Trigger className="flex-1">
              <AcrSelect.Value placeholder={
                !selectedMake
                  ? t("public.search.selectMakeFirst")
                  : isLoading
                    ? t("public.search.loadingOptions")
                    : models?.length === 0
                      ? t("public.search.noModelsAvailable")
                      : t("public.search.model")
              } />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              {selectedMake && models?.map((model) => (
                <AcrSelect.Item key={model} value={model}>
                  {model}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={selectedYear}
            onValueChange={(value) => setSelectedYear(value)}
            disabled={!selectedModel || isLoading}
            isLoading={isLoading && !selectedModel}
          >
            <AcrSelect.Trigger className="flex-1">
              <AcrSelect.Value placeholder={
                !selectedModel
                  ? t("public.search.selectModelFirst")
                  : isLoading
                    ? t("public.search.loadingOptions")
                    : years?.length === 0
                      ? t("public.search.noYearsAvailable")
                      : t("public.search.year")
              } />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              {selectedModel && years?.map((year) => (
                <AcrSelect.Item key={year} value={year.toString()}>
                  {year}
                </AcrSelect.Item>
              ))}
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrButton
            className="whitespace-nowrap h-auto py-3"
            onClick={handleVehicleSearch}
            disabled={!selectedMake || !selectedModel || !selectedYear || isLoading}
          >
            {isLoading ? t("public.search.loadingOptions") : t("public.search.button")}
          </AcrButton>
        </div>

        {/* SKU Search Toggle */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-acr-gray-600 hover:text-acr-red-600 transition-colors"
          >
            <span>
              {showAdvancedFilters
                ? t("public.search.hideAdvanced")
                : t("public.search.showAdvanced")}
            </span>
            {showAdvancedFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* SKU Search Panel */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showAdvancedFilters
              ? "max-h-48 md:max-h-32 opacity-100 mt-4"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-acr-gray-300 pt-4 pb-2 md:pb-0">
            <h4 className="text-md font-medium text-acr-gray-700 mb-3">
              {t("public.search.skuSearchTitle")}
            </h4>

            {/* Mobile: Stacked Layout */}
            <div className="md:hidden space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-acr-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerms.sku_term}
                  onChange={(e) =>
                    setSearchTerms({
                      ...searchTerms,
                      sku_term: e.target.value,
                      offset: 0,
                    })
                  }
                  placeholder={t("public.search.skuPlaceholder")}
                  className="w-full h-12 pl-10 pr-4 py-3 border border-acr-gray-400 rounded-lg focus:outline-none focus:border-acr-red-500 placeholder:text-acr-gray-500 transition-colors duration-200"
                />
                {searchTerms.sku_term && (
                  <button
                    onClick={() =>
                      setSearchTerms({
                        ...searchTerms,
                        sku_term: "",
                        offset: 0,
                      })
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-acr-gray-400 hover:text-acr-gray-600"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AcrButton className="w-full h-12">
                {t("public.search.button")}
              </AcrButton>
            </div>

            {/* Desktop: Horizontal Layout */}
            <div className="hidden md:flex md:items-center md:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-acr-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerms.sku_term}
                  onChange={(e) =>
                    setSearchTerms({
                      ...searchTerms,
                      sku_term: e.target.value,
                      offset: 0,
                    })
                  }
                  placeholder={t("public.search.skuPlaceholder")}
                  className="w-full pl-10 pr-4 py-3 border border-acr-gray-400 rounded-lg focus:outline-none focus:border-acr-red-500 placeholder:text-acr-gray-500 transition-colors duration-200"
                />
                {searchTerms.sku_term && (
                  <button
                    onClick={() =>
                      setSearchTerms({
                        ...searchTerms,
                        sku_term: "",
                        offset: 0,
                      })
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-acr-gray-400 hover:text-acr-gray-600"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AcrButton className="whitespace-nowrap h-auto py-3">
                {t("public.search.button")}
              </AcrButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
