"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  AcrInput,
  AcrLabel,
  AcrTextarea,
  AcrCard,
  AcrCardHeader,
  AcrCardContent,
  AcrButton,
  AcrComboBox,
  AcrTooltip,
} from "@/components/acr";
import { Info, Upload, Save } from "lucide-react";
import { Control, Controller } from "react-hook-form";
import { PartFormData } from "@/components/admin/parts/PartFormContainer";
import { FilterOptionsResponse } from "@/app/api/admin/filter-options/route";
import { useRef, useState, useEffect } from "react";
import { useFormState } from "react-hook-form";
import { supabaseBrowser } from "@/lib/supabase/browserClient";
import { useToast } from "@/hooks";
import { TranslationKeys } from "@/lib/i18n";
import Image from "next/image";
import { Loader2 } from "lucide-react";

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(data.image_url || "");
  const [imageLoading, setImageLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Helper function to check if field is dirty
  const isFieldDirty = (fieldName: keyof PartFormData) => {
    // In create mode, don't show dirty state for empty image_url
    if (isCreateMode && fieldName === "image_url" && !imageUrl) {
      return false;
    }
    return !!dirtyFields[fieldName];
  };

  // Helper function to get dirty field styling for ComboBox
  const getDirtyComboBoxClass = (fieldName: keyof PartFormData) => {
    return isFieldDirty(fieldName) ? "border-acr-red-500 ring-2 ring-acr-red-500" : "";
  };

  // Helper function to get dirty field styling for regular inputs
  const getDirtyInputClass = (fieldName: keyof PartFormData) => {
    return isFieldDirty(fieldName) ? "border-acr-red-500 ring-2 ring-acr-red-500" : "";
  };

  const processFileUpload = async (file: File) => {
    try {
      setImageLoading(true);

      // Add file size check (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File too large. Max 5MB.");
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image.");
      }

      // Unique filename
      const fileName = `${Date.now()}-${file.name}`;

      const { data: image, error: uploadError } = await supabaseBrowser.storage
        .from("acr-part-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: imageUrl } = await supabaseBrowser.storage
        .from("acr-part-images")
        .getPublicUrl(image?.path ?? "");

      setImageUrl(imageUrl.publicUrl);

      setImageLoading(false);

      toast({
        title: t("common.success"),
        description: t("partDetails.actions.saveSuccess"),
        variant: "success" as any,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setImageLoading(false);

      toast({
        title: t("common.error.title"),
        description: t("partDetails.actions.saveError"),
        variant: "destructive",
      });
    }
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    await processFileUpload(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFileUpload(files[0]);
    }
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
                <div>
                  <AcrLabel htmlFor="acr_sku">
                    <div className="flex items-center gap-2">
                      {t("partDetails.basicInfo.acrSku")}
                      <AcrTooltip.Info
                        content={t("partDetails.basicInfo.skuNote")}
                        side="right"
                      />
                    </div>
                  </AcrLabel>
                  <AcrInput
                    id="acr_sku"
                    value={data.acr_sku || ""}
                    readOnly
                    className="bg-acr-gray-50"
                  />
                </div>
              )}

              {/* SKU Number - Create Mode (Editable) */}
              {isCreateMode && (
                <div>
                  <AcrLabel htmlFor="sku_number">
                    {t("partDetails.basicInfo.acrSku")}
                  </AcrLabel>
                  <Controller
                    name="sku_number"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-acr-gray-600 font-medium pointer-events-none">
                          ACR
                        </div>
                        <AcrInput
                          id="sku_number"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="12345"
                          className="pl-16 pr-4 py-3 h-auto border-acr-gray-400 bg-white placeholder:text-acr-gray-500 focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent transition-colors duration-200"
                        />
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Dynamic Select Fields */}
              {selectFieldConfigs(filterOptions, t).map((config, index) => (
                <div key={`${config.name}-${index}`}>
                  <AcrLabel htmlFor={config.name}>
                    <div className="flex items-center gap-2">
                      {config.label}
                      {isFieldDirty(config.name) && (
                        <div className="w-2 h-2 bg-acr-red-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </AcrLabel>
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
                        className={getDirtyComboBoxClass(config.name)}
                      />
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <AcrLabel htmlFor="specifications">
                <div className="flex items-center gap-2">
                  {t("partDetails.basicInfo.additionalSpecs")}
                  {isFieldDirty("specifications") && (
                    <div className="w-2 h-2 bg-acr-red-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
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
                    className={getDirtyInputClass("specifications")}
                  />
                )}
              />
            </div>

            {/* Hidden image_url field */}
            <Controller
              name="image_url"
              control={control}
              render={({ field }) => {
                // Use useEffect to sync state changes
                useEffect(() => {
                  if (imageUrl !== field.value) {
                    field.onChange(imageUrl);
                  }
                }, [imageUrl, field]);

                return <input type="hidden" value={field.value || ""} />;
              }}
            />
          </div>

          {/* Product Image */}
          <div className="lg:col-span-1">
            <AcrLabel>
              <div className="flex items-center gap-2">
                {t("partDetails.basicInfo.productImage")}
                {isFieldDirty("image_url") && (
                  <div className="w-2 h-2 bg-acr-red-500 rounded-full flex-shrink-0"></div>
                )}
              </div>
            </AcrLabel>
            <div className="mt-2">
              {/* Product Image Display */}
              <div
                className={`w-full h-40 lg:h-48 bg-acr-gray-50 border-2 border-dashed rounded-lg flex items-center justify-center mb-4 relative overflow-hidden cursor-pointer transition-colors duration-200 ${
                  isDragOver
                    ? "border-acr-red-500 bg-acr-red-50"
                    : isFieldDirty("image_url")
                    ? "border-acr-red-500 hover:border-acr-red-600"
                    : "border-acr-gray-300 hover:border-acr-red-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageUrl && (
                  <>
                    <Image
                      src={imageUrl}
                      fill
                      style={{ objectFit: "contain" }}
                      alt="Part image"
                    />
                  </>
                )}
                {/* Show placeholder when no image */}
                {!imageUrl && (
                  <div className="text-center px-4">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-acr-red-600" />
                      </div>
                    )}
                    {!imageLoading && (
                      <>
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-acr-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-acr-gray-400" />
                        </div>
                        <p className="text-xs lg:text-sm text-acr-gray-600 mb-2">
                          {isDragOver
                            ? "Drop image here..."
                            : "Drop image here or click to browse"
                          }
                        </p>
                        <p className="text-xs text-acr-gray-500">
                          {t("partDetails.basicInfo.imageFormat")}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <AcrButton
                variant="secondary"
                size="default"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  {t("partDetails.basicInfo.selectFile")}
                </span>
                <span className="sm:hidden">Upload</span>
              </AcrButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.webp"
                className="hidden"
                onChange={uploadImage}
              />
            </div>
          </div>
        </div>
      </AcrCardContent>
    </AcrCard>
  );
}
