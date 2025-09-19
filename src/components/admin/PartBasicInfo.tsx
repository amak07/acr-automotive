"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrInput, AcrLabel, AcrSelect, AcrTextarea, AcrCard, AcrCardHeader, AcrCardContent, AcrButton } from "@/components/acr";
import { Info, Upload } from "lucide-react";

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
}

export function PartBasicInfo({ data }: PartBasicInfoProps) {
  const { t } = useLocale();

  return (
    <AcrCard variant="default" padding="none" className="mb-6">
      <AcrCardHeader className="px-6 pt-6">
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

            {/* Two Column Layout for remaining fields */}
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          {/* Part Type */}
          <div>
            <AcrLabel htmlFor="part_type">
              {t("partDetails.basicInfo.partType")}
            </AcrLabel>
            <AcrSelect.Root value={data.part_type || "__all__"} disabled>
              <AcrSelect.Trigger variant="disabled">
                <AcrSelect.Value />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="__all__">
                  {t("common.actions.all")}
                </AcrSelect.Item>
                <AcrSelect.Item value={data.part_type || ""}>
                  {data.part_type}
                </AcrSelect.Item>
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>

          {/* Position Type */}
          <div>
            <AcrLabel htmlFor="position_type">
              {t("partDetails.basicInfo.position")}
            </AcrLabel>
            <AcrSelect.Root value={data.position_type || "__all__"} disabled>
              <AcrSelect.Trigger variant="disabled">
                <AcrSelect.Value />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="__all__">
                  {t("common.actions.all")}
                </AcrSelect.Item>
                {data.position_type && (
                  <AcrSelect.Item value={data.position_type}>
                    {data.position_type}
                  </AcrSelect.Item>
                )}
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>

          {/* ABS Type */}
          <div>
            <AcrLabel htmlFor="abs_type">
              ABS {t("partDetails.basicInfo.type")}
            </AcrLabel>
            <AcrSelect.Root value={data.abs_type || "__all__"} disabled>
              <AcrSelect.Trigger variant="disabled">
                <AcrSelect.Value />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="__all__">
                  {t("common.actions.all")}
                </AcrSelect.Item>
                {data.abs_type && (
                  <AcrSelect.Item value={data.abs_type}>
                    {data.abs_type}
                  </AcrSelect.Item>
                )}
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>

          {/* Drive Type */}
          <div>
            <AcrLabel htmlFor="drive_type">
              {t("partDetails.basicInfo.drive")} {t("partDetails.basicInfo.type")}
            </AcrLabel>
            <AcrSelect.Root value={data.drive_type || "__all__"} disabled>
              <AcrSelect.Trigger variant="disabled">
                <AcrSelect.Value />
              </AcrSelect.Trigger>
              <AcrSelect.Content>
                <AcrSelect.Item value="__all__">
                  {t("common.actions.all")}
                </AcrSelect.Item>
                {data.drive_type && (
                  <AcrSelect.Item value={data.drive_type}>
                    {data.drive_type}
                  </AcrSelect.Item>
                )}
              </AcrSelect.Content>
            </AcrSelect.Root>
          </div>

              {/* Bolt Pattern */}
              <div className="lg:col-span-2">
                <AcrLabel htmlFor="bolt_pattern">
                  {t("partDetails.basicInfo.boltPattern")}
                </AcrLabel>
                <AcrInput
                  id="bolt_pattern"
                  value={data.bolt_pattern || ""}
                  readOnly
                  className="bg-acr-gray-50"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <AcrLabel htmlFor="notes">
                {t("partDetails.basicInfo.notes")}
              </AcrLabel>
              <AcrTextarea
                id="notes"
                value={data.specifications || ""}
                readOnly
                rows={4}
                className="bg-acr-gray-50"
                placeholder={t("partDetails.basicInfo.notesPlaceholder")}
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
                <span className="hidden sm:inline">{t("partDetails.basicInfo.selectFile")}</span>
                <span className="sm:hidden">Upload</span>
              </AcrButton>
            </div>
          </div>
        </div>
      </AcrCardContent>
    </AcrCard>
  );
}