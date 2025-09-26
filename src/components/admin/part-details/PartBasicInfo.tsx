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
  AcrImageUpload,
} from "@/components/acr";
import { Info } from "lucide-react";
import { Control, Controller, useFormContext } from "react-hook-form";
import { PartFormData } from "@/components/admin/parts/PartFormContainer";
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
    image_url?: string | null; // Part image URL
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
  const { setValue } = useFormContext<PartFormData>();

  // Helper function to check if field is dirty
  const isFieldDirty = (fieldName: keyof PartFormData) => {
    return !!dirtyFields[fieldName];
  };

  return (
    <AcrCard
      variant="default"
      padding="none"
      className="mb-6"
      data-testid="part-basic-info-section"
    >
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
                  <AcrInput
                    id="acr_sku"
                    value={data.acr_sku || ""}
                    readOnly
                    className="bg-acr-gray-50"
                  />
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

              {/* Dynamic Select Fields */}
              {selectFieldConfigs(filterOptions, t).map((config, index) => (
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
                          // Add "Not Specified" option for null/undefined values
                          {
                            label: isCreateMode
                              ? t("common.actions.select")
                              : t("common.notSpecified"),
                            value: `__unspecified_${config.name}__`,
                          },
                          // Add all the actual options
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

            {/* Notes */}
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
                  />
                )}
              />
            </AcrFormField>
          </div>

          {/* Product Image */}
          <div className="lg:col-span-1">
            <AcrFormField
              label={t("partDetails.basicInfo.productImage")}
              isDirty={isFieldDirty("image_url")}
            >
              <Controller
                name="image_url"
                control={control}
                render={({ field }) => (
                  <AcrImageUpload
                    value={field.value}
                    onValueChange={(url) => {
                      field.onChange(url);
                      setValue("image_url", url || "");
                    }}
                    onSuccess={() => {
                      toast({
                        title: t("common.success"),
                        description: t("partDetails.actions.saveSuccess"),
                        variant: "success" as any,
                      });
                    }}
                    onError={(error) => {
                      toast({
                        title: t("common.error.title"),
                        description: error,
                        variant: "destructive",
                      });
                    }}
                    buttonText={t("partDetails.basicInfo.selectFile")}
                    formatText={t("partDetails.basicInfo.imageFormat")}
                    bucket="acr-part-images"
                    maxSize={5 * 1024 * 1024}
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
