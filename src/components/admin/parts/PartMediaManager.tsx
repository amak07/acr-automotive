"use client";

import { useState } from "react";
import { Image, RotateCw } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useQuery } from "@tanstack/react-query";
import { PartImagesManager } from "./PartImagesManager";
import { Upload360Viewer } from "./Upload360Viewer";
import { AcrCard } from "@/components/acr";

interface PartMediaManagerProps {
  partId: string;
}

type MediaTab = "photos" | "360viewer";

/**
 * Unified card container for managing part media with integrated tabs:
 * - Tab 1: Product Photos (existing PartImagesManager)
 * - Tab 2: 360° Viewer (new Upload360Viewer)
 */
export function PartMediaManager({ partId }: PartMediaManagerProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<MediaTab>("photos");

  // Fetch 360° viewer status for badge indicator
  const { data: viewer360Data } = useQuery({
    queryKey: ["part-360-frames", partId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/parts/${partId}/360-frames`);
      if (!res.ok) throw new Error("Failed to fetch 360 frames");
      return res.json();
    },
  });

  const has360Viewer = (viewer360Data?.count || 0) > 0;

  return (
    <AcrCard variant="default" padding="none" className="mb-6">
      {/* Integrated tab navigation in card header */}
      <div className="px-4 pt-6 lg:px-6 border-b border-acr-gray-200">
        <div className="flex gap-1 -mb-px">
          {/* Photos Tab */}
          <button
            onClick={() => setActiveTab("photos")}
            className={`
              flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
              ${
                activeTab === "photos"
                  ? "border-purple-600 text-purple-600 font-medium"
                  : "border-transparent text-acr-gray-600 hover:text-acr-gray-900 hover:border-acr-gray-300"
              }
            `}
          >
            <Image className="w-4 h-4" />
            <span className="text-sm">{t("partDetails.media.photosTab")}</span>
          </button>

          {/* 360° Viewer Tab */}
          <button
            onClick={() => setActiveTab("360viewer")}
            className={`
              flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
              ${
                activeTab === "360viewer"
                  ? "border-blue-600 text-blue-600 font-medium"
                  : "border-transparent text-acr-gray-600 hover:text-acr-gray-900 hover:border-acr-gray-300"
              }
            `}
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-sm">{t("partDetails.media.viewer360Tab")}</span>
            {has360Viewer && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full leading-none">
                ✓
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pb-6 pt-6 lg:px-6">
        {activeTab === "photos" && <PartImagesManager partId={partId} />}
        {activeTab === "360viewer" && <Upload360Viewer partId={partId} />}
      </div>
    </AcrCard>
  );
}
