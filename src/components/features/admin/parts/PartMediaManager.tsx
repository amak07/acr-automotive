"use client";

import { useState, useEffect } from "react";
import { Image, RotateCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useQuery } from "@tanstack/react-query";
import { PartImagesManager } from "./PartImagesManager";
import { Upload360Viewer } from "./Upload360Viewer";
import { AcrCard } from "@/components/acr";

interface PartMediaManagerProps {
  partSku: string;
}

type MediaTab = "photos" | "360viewer";

/**
 * Unified card container for managing part media with integrated tabs:
 * - Tab 1: Product Photos (existing PartImagesManager)
 * - Tab 2: 360° Viewer (new Upload360Viewer)
 */
export function PartMediaManager({ partSku }: PartMediaManagerProps) {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<MediaTab>("photos");

  useEffect(() => {
    if (searchParams.get("tab") === "360viewer") {
      setActiveTab("360viewer");
    }
  }, [searchParams]);

  // Fetch 360° viewer status for badge indicator
  const { data: viewer360Data } = useQuery({
    queryKey: ["part-360-frames", partSku],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/360-frames`
      );
      if (!res.ok) throw new Error("Failed to fetch 360 frames");
      return res.json();
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const has360Viewer = (viewer360Data?.count || 0) > 0;

  return (
    <AcrCard variant="default" padding="none" className="overflow-hidden">
      {/* Thin red accent line at top - matches public search patterns */}
      <div className="h-0.5 bg-acr-red-500" />

      {/* Header */}
      <div className="px-4 pt-5 pb-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-acr-gray-100 rounded-lg flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="w-4 h-4 text-acr-gray-700" />
          </div>
          <div>
            <h2 className="acr-heading-6 text-acr-gray-900">
              {t("partDetails.media.title")}
            </h2>
            <p className="acr-caption text-acr-gray-600">
              {t("partDetails.media.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Integrated tab navigation */}
      <div className="px-4 lg:px-6 border-b border-acr-gray-200 bg-acr-gray-50">
        <div className="flex gap-1 -mb-px">
          {/* Photos Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`
              flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200
              ${
                activeTab === "photos"
                  ? "border-acr-red-500 text-acr-gray-900 font-semibold bg-white"
                  : "border-transparent text-acr-gray-600 hover:text-acr-gray-900 hover:border-acr-gray-300 hover:bg-white/50"
              }
            `}
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="w-4 h-4" />
            <span className="text-sm">{t("partDetails.media.photosTab")}</span>
          </button>

          {/* 360° Viewer Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("360viewer")}
            className={`
              flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200
              ${
                activeTab === "360viewer"
                  ? "border-acr-red-500 text-acr-gray-900 font-semibold bg-white"
                  : "border-transparent text-acr-gray-600 hover:text-acr-gray-900 hover:border-acr-gray-300 hover:bg-white/50"
              }
            `}
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-sm">
              {t("partDetails.media.viewer360Tab")}
            </span>
            {has360Viewer && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full leading-none font-medium">
                ✓
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pb-6 pt-6 lg:px-6">
        <div className={activeTab === "photos" ? "block" : "hidden"}>
          <PartImagesManager partSku={partSku} />
        </div>
        <div className={activeTab === "360viewer" ? "block" : "hidden"}>
          <Upload360Viewer partSku={partSku} />
        </div>
      </div>
    </AcrCard>
  );
}
