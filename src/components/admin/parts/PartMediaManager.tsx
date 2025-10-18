"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, RotateCw } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useQuery } from "@tanstack/react-query";
import { PartImagesManager } from "./PartImagesManager";
import { Upload360Viewer } from "./Upload360Viewer";

interface PartMediaManagerProps {
  partId: string;
}

/**
 * Tabbed container for managing part media:
 * - Tab 1: Product Photos (existing PartImagesManager)
 * - Tab 2: 360° Viewer (new Upload360Viewer)
 */
export function PartMediaManager({ partId }: PartMediaManagerProps) {
  const { t } = useLocale();

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
    <Tabs defaultValue="photos" className="mb-6">
      <TabsList className="w-full grid grid-cols-2 mb-4">
        <TabsTrigger value="photos" className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          {t("partDetails.media.photosTab")}
        </TabsTrigger>
        <TabsTrigger value="360viewer" className="flex items-center gap-2">
          <RotateCw className="w-4 h-4" />
          {t("partDetails.media.viewer360Tab")}
          {has360Viewer && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full">
              ✓
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="photos" className="mt-0">
        <PartImagesManager partId={partId} />
      </TabsContent>

      <TabsContent value="360viewer" className="mt-0">
        <Upload360Viewer partId={partId} />
      </TabsContent>
    </Tabs>
  );
}
