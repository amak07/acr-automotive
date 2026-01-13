"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  AcrInput,
  AcrTextarea,
  AcrCard,
  AcrCardHeader,
  AcrCardContent,
  AcrComboBox,
  AcrTooltip,
  AcrFormField,
  AcrPrefixInput,
} from "@/components/acr";
import { Info } from "lucide-react";
import { Control, Controller } from "react-hook-form";
import { PartFormData } from "@/components/features/admin/parts/PartFormContainer";
import { FilterOptionsResponse } from "@/app/api/admin/filter-options/route";
import { useFormState } from "react-hook-form";
import { useToast } from "@/hooks";
import { TranslationKeys } from "@/lib/i18n";

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
  control: Control<PartFormData>;
  filterOptions: FilterOptionsResponse | undefined;
  isCreateMode?: boolean;
}

const selectFieldConfigs = (
  filterOptions: FilterOptionsResponse | undefined,
  t: (key: keyof TranslationKeys) => string
) => [
  {
    name: "part_type" as const,
    label: t("partDetails.basicInfo.partType"),
    placeholder: "Select part type...",
    options: filterOptions?.part_types,
  },
  {
    name: "position_type" as const,
    label: t("partDetails.basicInfo.position"),
    placeholder: "Select position type...",
    options: filterOptions?.position_types,
  },
  {
    name: "abs_type" as const,
    label: t("partDetails.basicInfo.absType"),
    placeholder: "Select ABS...",
    options: filterOptions?.abs_types,
  },
  {
    name: "drive_type" as const,
    label: t("partDetails.basicInfo.driveType"),
    placeholder: "Select drive type...",
    options: filterOptions?.drive_types,
  },
  {
    name: "bolt_pattern" as const,
    label: t("partDetails.basicInfo.boltPattern"),
    placeholder: "Select bolt pattern...",
    options: filterOptions?.bolt_patterns,
  },
];

export function PartBasicInfo({
  data,
  control,
  filterOptions,
  isCreateMode,
}: PartBasicInfoProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const { dirtyFields } = useFormState({ control });

  // Helper function to check if field is dirty
  const isFieldDirty = (fieldName: keyof PartFormData) => {
    return !!dirtyFields[fieldName];
  };

  // Group fields by category for better organization
  const primaryFields = selectFieldConfigs(filterOptions, t).slice(0, 1); // part_type
  const specificationFields = selectFieldConfigs(filterOptions, t).slice(1); // position, abs, drive, bolt

  return (
    <AcrCard
      variant="default"
      padding="none"
      className="overflow-hidden"
      data-testid="part-basic-info-section"
    >
      {/* Thin red accent line at top - matches public search patterns */}
      <div className="h-0.5 bg-acr-red-500" />

      {/* Header */}
      <div className="px-4 pt-5 pb-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-acr-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-acr-gray-700" />
          </div>
          <div>
            <h2 className="acr-heading-6 text-acr-gray-900">
              {t("partDetails.basicInfo.title")}
            </h2>
            <p className="acr-caption text-acr-gray-600">
              {t("partDetails.basicInfo.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <AcrCardContent className="px-4 pb-6 pt-6 lg:px-6">
        <div className="space-y-8">
          {/* Primary Information Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-blue-600 rounded-full" />
              <h3 className="text-sm font-semibold text-acr-gray-700 uppercase tracking-wide">
                {t("partDetails.basicInfo.primaryInfo")}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* ACR SKU - Edit Mode (Read-only) */}
              {!isCreateMode && (
                <AcrFormField
                  label={t("partDetails.basicInfo.acrSku")}
                  htmlFor="acr_sku"
                  labelSuffix={
                    <AcrTooltip.Info
                      content={t("partDetails.basicInfo.skuNote")}
                      side="right"
                    />
                  }
                >
                  <div className="relative">
                    <AcrInput
                      id="acr_sku"
                      value={data.acr_sku || ""}
                      readOnly
                      className="font-mono font-bold bg-acr-gray-50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-acr-gray-200 text-acr-gray-600 text-xs font-medium rounded">
                      {t("common.readOnly")}
                    </div>
                  </div>
                </AcrFormField>
              )}

              {/* SKU Number - Create Mode (Editable) */}
              {isCreateMode && (
                <AcrFormField
                  label={t("partDetails.basicInfo.acrSku")}
                  htmlFor="sku_number"
                  isDirty={isFieldDirty("sku_number")}
                >
                  <Controller
                    name="sku_number"
                    control={control}
                    render={({ field }) => (
                      <AcrPrefixInput
                        id="sku_number"
                        prefix="ACR"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="12345"
                      />
                    )}
                  />
                </AcrFormField>
              )}

              {/* Part Type */}
              {primaryFields.map((config, index) => (
                <AcrFormField
                  key={`${config.name}-${index}`}
                  label={config.label}
                  htmlFor={config.name}
                  isDirty={isFieldDirty(config.name)}
                >
                  <Controller
                    name={config.name}
                    control={control}
                    render={({ field }) => (
                      <AcrComboBox
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                          {
                            label: isCreateMode
                              ? t("common.actions.select")
                              : t("common.notSpecified"),
                            value: `__unspecified_${config.name}__`,
                          },
                          ...(config.options?.map((option) => ({
                            label: option,
                            value: option,
                          })) || []),
                        ]}
                        placeholder={config.placeholder}
                        allowCustomValue
                        onCreateValue={async (value: string) => {
                          field.onChange(value);
                        }}
                      />
                    )}
                  />
                </AcrFormField>
              ))}
            </div>
          </div>

          {/* Specifications Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-purple-600 rounded-full" />
              <h3 className="text-sm font-semibold text-acr-gray-700 uppercase tracking-wide">
                {t("partDetails.basicInfo.specifications")}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {specificationFields.map((config, index) => (
                <AcrFormField
                  key={`${config.name}-${index}`}
                  label={config.label}
                  htmlFor={config.name}
                  isDirty={isFieldDirty(config.name)}
                >
                  <Controller
                    name={config.name}
                    control={control}
                    render={({ field }) => (
                      <AcrComboBox
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                          {
                            label: isCreateMode
                              ? t("common.actions.select")
                              : t("common.notSpecified"),
                            value: `__unspecified_${config.name}__`,
                          },
                          ...(config.options?.map((option) => ({
                            label: option,
                            value: option,
                          })) || []),
                        ]}
                        placeholder={config.placeholder}
                        allowCustomValue
                        onCreateValue={async (value: string) => {
                          field.onChange(value);
                        }}
                      />
                    )}
                  />
                </AcrFormField>
              ))}
            </div>
          </div>

          {/* Additional Notes Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-orange-600 rounded-full" />
              <h3 className="text-sm font-semibold text-acr-gray-700 uppercase tracking-wide">
                {t("partDetails.basicInfo.additionalInfo")}
              </h3>
            </div>

            <AcrFormField
              label={t("partDetails.basicInfo.additionalSpecs")}
              htmlFor="specifications"
              isDirty={isFieldDirty("specifications")}
            >
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
                    className="resize-none"
                  />
                )}
              />
            </AcrFormField>
          </div>
        </div>
      </AcrCardContent>
    </AcrCard>
  );
}
