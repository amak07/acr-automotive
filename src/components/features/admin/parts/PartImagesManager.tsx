"use client";

import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image, Upload, X, Star } from "lucide-react";
import { useToast } from "@/hooks/common/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import { Tables } from "@/lib/supabase/types";
import { queryKeys } from "@/hooks/common/queryKeys";
import { TranslationKeys } from "@/lib/i18n/translation-keys";

type PartImage = Tables<"part_images">;

const VIEW_TYPES = ["front", "back", "top", "other"] as const;
type ViewType = (typeof VIEW_TYPES)[number];

const SLOT_LABELS: Record<ViewType, keyof TranslationKeys> = {
  front: "partDetails.images.slotFront",
  back: "partDetails.images.slotBack",
  top: "partDetails.images.slotTop",
  other: "partDetails.images.slotOther",
};

interface PartImagesManagerProps {
  partSku: string;
}

export function PartImagesManager({ partSku }: PartImagesManagerProps) {
  const { toast } = useToast();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  // Fetch existing images
  const { data: images } = useQuery({
    queryKey: ["part-images", partSku],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/images`
      );
      if (!res.ok) throw new Error("Failed to fetch images");
      const json = await res.json();
      return json.data as PartImage[];
    },
  });

  // Build a map of view_type → image for slot rendering
  const imagesByViewType: Record<string, PartImage> = {};
  images?.forEach((img) => {
    if (img.view_type) {
      imagesByViewType[img.view_type] = img;
    }
  });

  const imageCount = Object.keys(imagesByViewType).length;

  const invalidateAllCaches = () => {
    queryClient.invalidateQueries({ queryKey: ["part-images", partSku] });
    queryClient.invalidateQueries({
      queryKey: queryKeys.parts.adminDetail(partSku),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.parts.publicDetail(partSku),
    });
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as string[];
        return key[0] === "public" && key[1] === "parts" && key[2] === "list";
      },
    });
  };

  // Upload/replace image for a specific slot
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      viewType,
    }: {
      file: File;
      viewType: ViewType;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("view_type", viewType);

      const response = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/images`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("partDetails.images.uploadSuccess").replace(
          "{{count}}",
          "1"
        ),
        variant: "success",
      });
      invalidateAllCaches();
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error.title"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/images/${imageId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete image");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("partDetails.images.deleteSuccess"),
        variant: "success",
      });
      invalidateAllCaches();
    },
    onError: (error: Error) => {
      toast({
        title: t("partDetails.images.deleteFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div data-testid="part-images-section">
      <div className="mb-6" data-testid="part-images-header">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
            <Image className="w-4 h-4 text-white" />
          </div>
          <h2 className="acr-heading-6 text-acr-gray-900">
            {t("partDetails.images.title")}
          </h2>
          <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded-full acr-caption">
            {imageCount}/4
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-3 lg:gap-4"
        data-testid="part-images-content"
      >
        {VIEW_TYPES.map((viewType) => (
          <ImageSlot
            key={viewType}
            viewType={viewType}
            image={imagesByViewType[viewType] || null}
            label={t(SLOT_LABELS[viewType])}
            isPrimary={viewType === "front"}
            onUpload={(file) => {
              if (!file.type.startsWith("image/")) {
                toast({
                  title: t("partDetails.images.uploadFailed"),
                  description: `${file.name}: not an image file`,
                  variant: "destructive",
                });
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                toast({
                  title: t("partDetails.images.uploadFailed"),
                  description: `${file.name}: file too large (max 5MB)`,
                  variant: "destructive",
                });
                return;
              }
              uploadMutation.mutate({ file, viewType });
            }}
            onDelete={(imageId) => {
              if (confirm(t("partDetails.images.deleteConfirm"))) {
                deleteMutation.mutate(imageId);
              }
            }}
            isUploading={uploadMutation.isPending}
            isDeleting={deleteMutation.isPending}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

interface ImageSlotProps {
  viewType: ViewType;
  image: PartImage | null;
  label: string;
  isPrimary: boolean;
  onUpload: (file: File) => void;
  onDelete: (imageId: string) => void;
  isUploading: boolean;
  isDeleting: boolean;
  t: (key: keyof TranslationKeys) => string;
}

function ImageSlot({
  viewType,
  image,
  label,
  isPrimary,
  onUpload,
  onDelete,
  isUploading,
  isDeleting,
  t,
}: ImageSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onUpload(file);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (image) {
    // Filled slot — show image with overlay controls
    return (
      <div
        className="relative group rounded-xl border border-acr-gray-200 overflow-hidden bg-acr-gray-100 aspect-square"
        data-testid={`image-slot-${viewType}`}
      >
        <img
          src={image.image_url}
          alt={`${label} view`}
          className="w-full h-full object-cover"
        />

        {/* Label + primary badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center gap-1.5">
            {isPrimary && (
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            )}
            <span className="text-white text-xs font-medium">{label}</span>
          </div>
        </div>

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="px-3 py-1.5 bg-white text-acr-gray-900 text-xs font-medium rounded-lg hover:bg-acr-gray-100 transition-colors"
          >
            {t("partDetails.images.replaceImage")}
          </button>
          <button
            type="button"
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
            className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title={t("partDetails.images.deleteTooltip")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  // Empty slot — upload zone
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUploading}
      className="relative rounded-xl border-2 border-dashed border-acr-gray-300 aspect-square flex flex-col items-center justify-center gap-2 hover:border-acr-red-400 hover:bg-acr-red-50/30 transition-all duration-200 cursor-pointer group"
      data-testid={`image-slot-${viewType}`}
    >
      <Upload className="w-6 h-6 text-acr-gray-400 group-hover:text-acr-red-500 transition-colors" />
      <div className="text-center">
        <span className="text-xs font-medium text-acr-gray-600 block">
          {label}
        </span>
        <span className="text-xs text-acr-gray-400">
          {isUploading
            ? t("partDetails.images.uploading")
            : t("partDetails.images.clickToUpload")}
        </span>
      </div>
      {isPrimary && (
        <Star className="absolute top-2 right-2 w-4 h-4 text-acr-gray-300" />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </button>
  );
}
