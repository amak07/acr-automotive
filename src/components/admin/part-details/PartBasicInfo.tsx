"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  AcrInput,
  AcrLabel,
  AcrSelect,
  AcrTextarea,
  AcrCard,
  AcrCardHeader,
  AcrCardContent,
  AcrButton,
} from "@/components/acr";
import { Info, Upload } from "lucide-react";
import { Control, Controller } from "react-hook-form";
import { PartUpdateForm } from "@/app/admin/parts/[id]/page";
import { FilterOptionsResponse } from "@/app/api/admin/filter-options/route";

interface PartBasicInfoProps {
  data: {
    acr_sku?: string;
    part_type?: string;
    position_type?: string | null;
    abs_type?: string | null;
    drive_type?: string | null;
    bolt_pattern?: string | null;
    specifications?: string | null; // This is the notes field
  };
  control: Control<PartUpdateForm>;
  filterOptions: FilterOptionsResponse;
}

export function PartBasicInfo({ data, control, filterOptions }: PartBasicInfoProps) {
  const { t } = useLocale();

  const selectFieldConfigs = [
    {
      name: "part_type" as const,
      label: t("partDetails.basicInfo.partType"),
      placeholder: "Select part type...",
      options: filterOptions.part_types,
    },
    {
      name: "position_type" as const,
      label: t("partDetails.basicInfo.position"),
      placeholder: "Select position type...",
      options: filterOptions.position_types,
    },
    {
      name: "abs_type" as const,
      label: t("partDetails.basicInfo.absType"),
      placeholder: "Select ABS...",
      options: filterOptions.abs_types,
    },
    {
      name: "drive_type" as const,
      label: t("partDetails.basicInfo.driveType"),
      placeholder: "Select drive type...",
      options: filterOptions.drive_types,
    },
    {
      name: "bolt_pattern" as const,
      label: t("partDetails.basicInfo.boltPattern"),
      placeholder: "Select bolt pattern...",
      options: filterOptions.bolt_patterns,
    },
  ];

  return (
    <AcrCard variant="default" padding="none" className="mb-6" data-testid="part-basic-info-section">
      <AcrCardHeader className="px-6 pt-6" data-testid="part-basic-info-header">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <Info className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-acr-gray-900">
            {t("partDetails.basicInfo.title")}
          </h2>
        </div>
      </AcrCardHeader>

      <AcrCardContent className="px-4 pb-6 lg:px-6">
        {/* Main Layout Grid */}
        <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
          {/* Left Column - Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Two Column Layout for remaining fields */}
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              {/* ACR SKU */}
              <div>
                <AcrLabel htmlFor="acr_sku">
                  {t("partDetails.basicInfo.acrSku")}
                </AcrLabel>
                <AcrInput
                  id="acr_sku"
                  value={data.acr_sku || ""}
                  readOnly
                  className="bg-acr-gray-50"
                />
                <p className="text-xs text-acr-gray-500 mt-1">
                  {t("partDetails.basicInfo.skuNote")}
                </p>
              </div>

              {/* Dynamic Select Fields */}
              {selectFieldConfigs.map((config, index) => (
                <div key={`${config.name}-${index}`}>
                  <AcrLabel htmlFor={config.name}>{config.label}</AcrLabel>
                  <Controller
                    name={config.name}
                    control={control}
                    render={({ field }) => (
                      <AcrSelect.Root
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <AcrSelect.Trigger>
                          <AcrSelect.Value placeholder={config.placeholder} />
                        </AcrSelect.Trigger>
                        <AcrSelect.Content>
                          <AcrSelect.Item key={`unspec-${config.name}`} value={`__unspecified_${config.name}__`}>
                            {t("common.notSpecified")}
                          </AcrSelect.Item>
                          {config.options?.map((item: string, itemIndex: number) => (
                            <AcrSelect.Item
                              key={`${config.name}-${item}-${itemIndex}`}
                              value={item || "__empty__"}
                            >
                              {item || "Empty"}
                            </AcrSelect.Item>
                          ))}
                        </AcrSelect.Content>
                      </AcrSelect.Root>
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <AcrLabel htmlFor="specifications">
                {t("partDetails.basicInfo.additionalSpecs")}
              </AcrLabel>
              <Controller
                name="specifications"
                control={control}
                render={({ field }) => (
                  <AcrTextarea
                    id="specifications"
                    value={field.value}
                    rows={4}
                    placeholder={t("partDetails.basicInfo.notesPlaceholder")}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </div>
          </div>

          {/* Product Image */}
          <div className="lg:col-span-1">
            <AcrLabel>{t("partDetails.basicInfo.productImage")}</AcrLabel>
            <div className="mt-2">
              {/* Product Image Display */}
              <div className="w-full h-40 lg:h-48 bg-acr-gray-50 border-2 border-dashed border-acr-gray-300 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center px-4">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-acr-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-acr-gray-400" />
                  </div>
                  <p className="text-xs lg:text-sm text-acr-gray-600 mb-2">
                    {t("partDetails.basicInfo.imageUploadText")}
                  </p>
                  <p className="text-xs text-acr-gray-500">
                    {t("partDetails.basicInfo.imageFormat")}
                  </p>
                </div>
              </div>

              {/* Upload Button */}
              <AcrButton variant="secondary" size="default" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  {t("partDetails.basicInfo.selectFile")}
                </span>
                <span className="sm:hidden">Upload</span>
              </AcrButton>
            </div>
          </div>
        </div>
      </AcrCardContent>
    </AcrCard>
  );
}
