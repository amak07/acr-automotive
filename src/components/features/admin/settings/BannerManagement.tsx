"use client";

import { useState, useRef } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit,
  Upload,
  ImageIcon,
} from "lucide-react";
import { AcrButton, AcrCard } from "@/components/acr";
import { useToast } from "@/hooks/common/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import type { Banner } from "@/types/domain/settings";
import Image from "next/image";

interface BannerManagementProps {
  banners: Banner[];
  onUpdateBanners: (banners: Banner[]) => void;
  isDirty: boolean;
}

export function BannerManagement({
  banners,
  onUpdateBanners,
}: BannerManagementProps) {
  const { toast } = useToast();
  const { t } = useLocale();
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const bannerDesktopInputRefs = useRef<
    Record<string, HTMLInputElement | null>
  >({});
  const bannerMobileInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {}
  );

  // Banner management functions
  const addBanner = () => {
    const newBanner: Banner = {
      id: `banner-${Date.now()}`,
      image_url: "",
      mobile_image_url: "",
      title: "",
      subtitle: "",
      cta_text: "",
      cta_link: "",
      display_order: banners.length,
      is_active: true,
    };
    onUpdateBanners([...banners, newBanner]);
    setEditingBannerId(newBanner.id);
  };

  const deleteBanner = (bannerId: string) => {
    if (!confirm(t("admin.settings.branding.deleteBannerConfirm"))) {
      return;
    }
    const updatedBanners = banners
      .filter((b) => b.id !== bannerId)
      .map((b, index) => ({ ...b, display_order: index }));
    onUpdateBanners(updatedBanners);
    if (editingBannerId === bannerId) {
      setEditingBannerId(null);
    }
  };

  const moveBanner = (bannerId: string, direction: "up" | "down") => {
    const currentIndex = banners.findIndex((b) => b.id === bannerId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const updatedBanners = [...banners];
    [updatedBanners[currentIndex], updatedBanners[newIndex]] = [
      updatedBanners[newIndex],
      updatedBanners[currentIndex],
    ];

    // Update display_order
    updatedBanners.forEach((banner, index) => {
      banner.display_order = index;
    });

    onUpdateBanners(updatedBanners);
  };

  const updateBanner = (bannerId: string, updates: Partial<Banner>) => {
    const updatedBanners = banners.map((b) =>
      b.id === bannerId ? { ...b, ...updates } : b
    );
    onUpdateBanners(updatedBanners);
  };

  const uploadBannerImage = async (
    bannerId: string,
    file: File,
    imageType: "desktop" | "mobile"
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "banner");

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

      // Update banner image URL
      if (imageType === "desktop") {
        updateBanner(bannerId, { image_url: data.url });
      } else {
        updateBanner(bannerId, { mobile_image_url: data.url });
      }

      toast({
        variant: "success",
        title: t("admin.settings.branding.uploadSuccess"),
        description: `Banner ${imageType} image uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("admin.settings.branding.uploadFailed"),
        description: error.message,
      });
    }
  };

  if (banners.length === 0) {
    return (
      <div className="border-2 border-dashed border-acr-gray-300 rounded-lg p-8 text-center">
        <ImageIcon className="w-12 h-12 text-acr-gray-400 mx-auto mb-3" />
        <p className="text-sm text-acr-gray-600 mb-4">
          {t("admin.settings.branding.noBanners")}
        </p>
        <AcrButton type="button" variant="secondary" onClick={addBanner}>
          <Plus className="w-4 h-4 mr-2" />
          {t("admin.settings.branding.addFirstBanner")}
        </AcrButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Banner Button */}
      <div className="flex justify-end">
        <AcrButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={addBanner}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("admin.settings.branding.addBanner")}
        </AcrButton>
      </div>

      {/* Banner List */}
      {banners.map((banner, index) => (
        <AcrCard
          key={banner.id}
          variant={banner.is_active ? "elevated" : "outlined"}
          padding="default"
        >
          {/* Banner Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="acr-heading-6 text-acr-gray-700">
                Banner {index + 1}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={banner.is_active}
                  onChange={(e) =>
                    updateBanner(banner.id, {
                      is_active: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-acr-red-600 border-acr-gray-300 rounded focus:ring-acr-red-500"
                />
                <span className="text-xs text-acr-gray-600">
                  {t("admin.settings.branding.active")}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {/* Move Up/Down */}
              <button
                type="button"
                onClick={() => moveBanner(banner.id, "up")}
                disabled={index === 0}
                className="p-2 text-acr-gray-600 hover:text-acr-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move up"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => moveBanner(banner.id, "down")}
                disabled={index === banners.length - 1}
                className="p-2 text-acr-gray-600 hover:text-acr-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move down"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              {/* Edit/Collapse Toggle */}
              <button
                type="button"
                onClick={() =>
                  setEditingBannerId(
                    editingBannerId === banner.id ? null : banner.id
                  )
                }
                className="p-2 text-acr-gray-600 hover:text-acr-gray-900"
                aria-label="Edit banner"
              >
                <Edit className="w-5 h-5" />
              </button>
              {/* Delete */}
              <button
                type="button"
                onClick={() => deleteBanner(banner.id)}
                className="p-2 text-red-600 hover:text-red-800"
                aria-label="Delete banner"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Banner Preview (Collapsed State) */}
          {editingBannerId !== banner.id && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {banner.image_url ? (
                <div className="relative w-full sm:w-48 h-24 border border-acr-gray-300 rounded overflow-hidden">
                  <Image
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full sm:w-48 h-24 border border-dashed border-acr-gray-300 rounded flex items-center justify-center bg-acr-gray-50">
                  <ImageIcon className="w-6 h-6 text-acr-gray-400" />
                </div>
              )}
              <div className="flex-1 w-full text-center sm:text-left">
                <p className="text-sm font-medium text-acr-gray-900">
                  {banner.title || t("admin.settings.branding.untitled")}
                </p>
                {banner.subtitle && (
                  <p className="text-xs text-acr-gray-600 mt-1">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Banner Edit Form (Expanded State) */}
          {editingBannerId === banner.id && (
            <div className="space-y-4 pt-3 border-t border-acr-gray-200">
              {/* Desktop Image */}
              <div>
                <label className="block text-xs font-semibold text-acr-gray-700 mb-2">
                  {t("admin.settings.branding.desktopImage")} *
                </label>
                <div className="flex items-start gap-3">
                  {banner.image_url ? (
                    <div className="relative w-full h-32 sm:h-40 border border-acr-gray-300 rounded overflow-hidden">
                      <Image
                        src={banner.image_url}
                        alt="Desktop banner"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 sm:h-40 border border-dashed border-acr-gray-300 rounded flex items-center justify-center bg-acr-gray-50">
                      <ImageIcon className="w-8 h-8 text-acr-gray-400" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <AcrButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      bannerDesktopInputRefs.current[banner.id]?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t("admin.settings.branding.uploadImage")}
                  </AcrButton>
                  <input
                    ref={(el) => {
                      bannerDesktopInputRefs.current[banner.id] = el;
                    }}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBannerImage(banner.id, file, "desktop");
                    }}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-acr-gray-500 mt-1">
                  {t("admin.settings.branding.recommendedSize")}: 1560x480px
                  (WebP recommended)
                </p>
              </div>

              {/* Mobile Image (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-acr-gray-700 mb-2">
                  {t("admin.settings.branding.mobileImage")}{" "}
                  <span className="font-normal text-acr-gray-500">
                    ({t("admin.settings.branding.optional")})
                  </span>
                </label>
                <div className="flex items-start gap-3">
                  {banner.mobile_image_url ? (
                    <div className="relative w-full sm:w-48 h-32 border border-acr-gray-300 rounded overflow-hidden">
                      <Image
                        src={banner.mobile_image_url}
                        alt="Mobile banner"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full sm:w-48 h-32 border border-dashed border-acr-gray-300 rounded flex items-center justify-center bg-acr-gray-50">
                      <ImageIcon className="w-6 h-6 text-acr-gray-400" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <AcrButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      bannerMobileInputRefs.current[banner.id]?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t("admin.settings.branding.uploadImage")}
                  </AcrButton>
                  <input
                    ref={(el) => {
                      bannerMobileInputRefs.current[banner.id] = el;
                    }}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBannerImage(banner.id, file, "mobile");
                    }}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-acr-gray-500 mt-1">
                  {t("admin.settings.branding.recommendedSize")}: 800x300px
                  (WebP recommended)
                </p>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-acr-gray-700 mb-1">
                    {t("admin.settings.branding.title")}
                  </label>
                  <input
                    type="text"
                    value={banner.title || ""}
                    onChange={(e) =>
                      updateBanner(banner.id, { title: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-acr-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder={t("admin.settings.branding.titlePlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-acr-gray-700 mb-1">
                    {t("admin.settings.branding.subtitle")}
                  </label>
                  <input
                    type="text"
                    value={banner.subtitle || ""}
                    onChange={(e) =>
                      updateBanner(banner.id, {
                        subtitle: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-acr-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder={t(
                      "admin.settings.branding.subtitlePlaceholder"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-acr-gray-700 mb-1">
                    {t("admin.settings.branding.ctaText")}
                  </label>
                  <input
                    type="text"
                    value={banner.cta_text || ""}
                    onChange={(e) =>
                      updateBanner(banner.id, {
                        cta_text: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-acr-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder={t(
                      "admin.settings.branding.ctaTextPlaceholder"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-acr-gray-700 mb-1">
                    {t("admin.settings.branding.ctaLink")}
                  </label>
                  <input
                    type="text"
                    value={banner.cta_link || ""}
                    onChange={(e) =>
                      updateBanner(banner.id, {
                        cta_link: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-acr-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder={t(
                      "admin.settings.branding.ctaLinkPlaceholder"
                    )}
                  />
                </div>
              </div>

              {/* Collapse Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBannerId(null)}
                  className="text-xs text-acr-gray-600 hover:text-acr-gray-900"
                >
                  {t("admin.settings.branding.collapse")}
                </button>
              </div>
            </div>
          )}
        </AcrCard>
      ))}
    </div>
  );
}
