"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Upload, ImageIcon } from "lucide-react";
import { AcrButton, AcrCard } from "@/components/acr";
import { useToast } from "@/hooks/common/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import { brandingSchema, type BrandingParams } from "@/lib/schemas/admin";
import Image from "next/image";
import { BannerManagement } from "./BannerManagement";

export function BrandingSettings() {
  const { toast } = useToast();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "branding"],
    queryFn: async () => {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      // Return null instead of undefined to satisfy TanStack Query
      return (data.settings?.branding as BrandingParams) ?? null;
    },
  });

  // Form setup with default banners array
  // Ensure all banner fields have proper defaults to prevent validation errors
  const formDefaults = settings
    ? {
        ...settings,
        company_name: settings.company_name || "",
        logo_url: settings.logo_url || "",
        favicon_url: settings.favicon_url || "",
        banners: (settings.banners || []).map((banner) => ({
          id: banner.id || `banner-${Date.now()}`,
          image_url: banner.image_url || "",
          mobile_image_url: banner.mobile_image_url || "",
          title: banner.title || "",
          subtitle: banner.subtitle || "",
          cta_text: banner.cta_text || "",
          cta_link: banner.cta_link || "",
          display_order:
            typeof banner.display_order === "number" ? banner.display_order : 0,
          is_active:
            typeof banner.is_active === "boolean" ? banner.is_active : true,
        })),
      }
    : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<BrandingParams>({
    resolver: zodResolver(brandingSchema),
    values: formDefaults, // Auto-populate when data loads
  });

  const logoUrl = watch("logo_url");
  const faviconUrl = watch("favicon_url");
  const banners = watch("banners") || [];

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: BrandingParams) => {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "branding",
          value: data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update settings");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate both admin and public settings queries
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["public", "settings"] });
      reset(data.setting.value); // Reset form with saved values
      toast({
        variant: "success",
        title: t("admin.settings.branding.updated"),
        description: t("admin.settings.branding.success"),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("admin.settings.branding.error"),
        description: error.message,
      });
    },
  });

  // File upload handler
  const handleFileUpload = async (
    file: File,
    assetType: "logo" | "favicon"
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", assetType);

    const setLoading =
      assetType === "logo" ? setIsUploadingLogo : setIsUploadingFavicon;
    setLoading(true);

    try {
      const response = await fetch("/api/admin/settings/upload-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();

      // Update form value
      if (assetType === "logo") {
        setValue("logo_url", data.url, { shouldDirty: true });
      } else {
        setValue("favicon_url", data.url, { shouldDirty: true });
      }

      const labels = {
        logo: t("admin.settings.branding.logo"),
        favicon: t("admin.settings.branding.favicon"),
      };
      toast({
        variant: "success",
        title: t("admin.settings.branding.uploadSuccess"),
        description: `${labels[assetType]} uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("admin.settings.branding.uploadFailed"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: BrandingParams) => {
    updateMutation.mutate(data);
  };

  // Debug handler to log validation errors when form submission fails
  const onValidationError = (errors: Record<string, unknown>) => {
    console.error("[BrandingSettings] Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: t("admin.settings.branding.error"),
      description: "Please check the form for errors",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-acr-red-600" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onValidationError)}
      className="space-y-6"
    >
      {/* Company Identity Section */}
      <AcrCard variant="outlined" padding="default">
        <h2 className="acr-heading-5 text-acr-gray-900 mb-6">
          {t("admin.settings.branding.identity")}
        </h2>

        <div className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-semibold text-acr-gray-900 mb-2">
              {t("admin.settings.branding.companyName")}
            </label>
            <input
              type="text"
              {...register("company_name")}
              className="w-full px-4 py-3 border-2 border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder={t("admin.settings.branding.companyNamePlaceholder")}
            />
            {errors.company_name && (
              <p className="text-sm text-red-600 mt-1">
                {errors.company_name.message}
              </p>
            )}
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-acr-gray-900 mb-2">
              {t("admin.settings.branding.logo")}
            </label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {logoUrl && (
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 border-2 border-acr-gray-300 rounded-lg overflow-hidden bg-white mx-auto sm:mx-0">
                  <Image
                    src={logoUrl}
                    alt="Company Logo"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}
              <div className="flex-1 w-full space-y-2">
                <AcrButton
                  type="button"
                  variant="secondary"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="w-full sm:w-auto"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("admin.settings.branding.uploading")}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t("admin.settings.branding.uploadLogo")}
                    </>
                  )}
                </AcrButton>
                <p className="text-xs text-acr-gray-500">
                  {t("admin.settings.branding.logoFormat")}
                </p>
              </div>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "logo");
              }}
            />
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-semibold text-acr-gray-900 mb-2">
              {t("admin.settings.branding.favicon")}
            </label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {faviconUrl ? (
                <div className="relative w-16 h-16 border-2 border-acr-gray-300 rounded-lg overflow-hidden bg-white mx-auto sm:mx-0">
                  <Image
                    src={faviconUrl}
                    alt="Favicon"
                    fill
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 border-2 border-dashed border-acr-gray-300 rounded-lg flex items-center justify-center bg-acr-gray-50 mx-auto sm:mx-0">
                  <ImageIcon className="w-6 h-6 text-acr-gray-400" />
                </div>
              )}
              <div className="flex-1 w-full space-y-2">
                <AcrButton
                  type="button"
                  variant="secondary"
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={isUploadingFavicon}
                  className="w-full sm:w-auto"
                >
                  {isUploadingFavicon ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("admin.settings.branding.uploading")}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t("admin.settings.branding.uploadFavicon")}
                    </>
                  )}
                </AcrButton>
                <p className="text-xs text-acr-gray-500">
                  {t("admin.settings.branding.faviconFormat")}
                </p>
              </div>
            </div>
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/x-icon,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "favicon");
              }}
            />
          </div>
        </div>
      </AcrCard>

      {/* Banner Management Section */}
      <AcrCard variant="outlined" padding="default">
        <h2 className="acr-heading-5 text-acr-gray-900 mb-6">
          {t("admin.settings.branding.bannersSection")}
        </h2>

        <BannerManagement
          banners={banners}
          onUpdateBanners={(updated) =>
            setValue("banners", updated, { shouldDirty: true })
          }
          isDirty={isDirty}
        />
      </AcrCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <AcrButton
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
          className="min-w-[120px]"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("admin.settings.actions.saving")}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t("admin.settings.actions.save")}
            </>
          )}
        </AcrButton>
      </div>
    </form>
  );
}
