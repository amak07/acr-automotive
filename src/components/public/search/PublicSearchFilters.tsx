"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Search, XCircleIcon, ChevronDown, ChevronUp } from "lucide-react";
import { AcrButton } from "@/components/acr/Button";
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { data, isLoading, error } = useVehicleOptions();

  // dropdown list options.
  const [models, setModels] = useState<string[] | undefined>();
  const [years, setYears] = useState<number[] | undefined>();

  // selected options for SearchTerms.
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  // for SKU term lookup
  const [skuTerm, setSkuTerm] = useState<string>("");

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
    <div className="space-y-4">
      {/* Vehicle Search Section */}
      <div className="bg-white p-3 rounded-lg border border-acr-gray-300 shadow-md lg:p-4">
        <h3 className="text-lg font-semibold text-acr-gray-900 mb-3">
          {t("public.search.vehicleSearchTitle")}
        </h3>

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
            {t("public.search.button")}
          </AcrButton>
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
            {t("public.search.button")}
          </AcrButton>
        </div>

        {/* SKU Search Toggle */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-acr-blue-600 hover:text-acr-blue-800 underline hover:no-underline transition-all duration-200"
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
                  value={skuTerm}
                  onChange={(e) => setSkuTerm(e.target.value)}
                  placeholder={t("public.search.skuPlaceholder")}
                  className="w-full h-12 pl-10 pr-4 py-3 border border-acr-gray-400 rounded-lg focus:outline-none focus:border-acr-red-500 placeholder:text-acr-gray-500 transition-colors duration-200"
                />
                {skuTerm && (
                  <button
                    onClick={() => setSkuTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-acr-gray-400 hover:text-acr-gray-600"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AcrButton
                className="w-full h-12"
                onClick={handleSkuTermSearch}
                disabled={!skuTerm}
              >
                {t("public.search.button")}
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
                {skuTerm && (
                  <button
                    onClick={() => {
                      setSearchTerms({
                        ...DEFAULT_PUBLIC_SEARCH_TERMS,
                      });
                      setSkuTerm("");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-acr-gray-400 hover:text-acr-gray-600"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AcrButton
                className="whitespace-nowrap h-auto py-3"
                onClick={handleSkuTermSearch}
                disabled={!skuTerm}
              >
                {t("public.search.button")}
              </AcrButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
