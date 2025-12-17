"use client";

import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image, Upload, Plus } from "lucide-react";
import { useToast } from "@/hooks/common/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import { Tables } from "@/lib/supabase/types";
import { ImageGalleryEditor } from "./ImageGalleryEditor";
import { AcrButton } from "@/components/acr";
import { queryKeys } from "@/hooks/common/queryKeys";

type PartImage = Tables<"part_images">;

interface PartImagesManagerProps {
  partSku: string;
}

export function PartImagesManager({ partSku }: PartImagesManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const MAX_IMAGES = 10; // Matches VALIDATION.maxProductImages in patterns.config.ts

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

  const imageCount = images?.length || 0;
  const isAtMaxCapacity = imageCount >= MAX_IMAGES;

  // Upload images mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

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
    onSuccess: (data) => {
      toast({
        title: t("common.success"),
        description: t("partDetails.images.uploadSuccess").replace(
          "{{count}}",
          String(data.count)
        ),
        variant: "success",
      });
      // Invalidate admin part images
      queryClient.invalidateQueries({ queryKey: ["part-images", partSku] });

      // Invalidate both admin and public part details caches
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.adminDetail(partSku),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.publicDetail(partSku),
      });

      // Invalidate public parts list to update primary images in search results
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === "public" && key[1] === "parts" && key[2] === "list";
        },
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error.title"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reorder images mutation
  const reorderMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      const response = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/images/reorder`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_ids: imageIds }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reorder images");
      }

      return response.json();
    },
    onSuccess: () => {
      console.log("[DEBUG] Reorder success - invalidating queries");
      // Invalidate admin part images
      queryClient.invalidateQueries({ queryKey: ["part-images", partSku] });

      // Invalidate both admin and public part details caches
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.adminDetail(partSku),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.publicDetail(partSku),
      });

      // Invalidate public parts list to update primary images in search results
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === "public" && key[1] === "parts" && key[2] === "list";
        },
      });
      console.log("[DEBUG] All queries invalidated");
    },
    onError: (error: Error) => {
      toast({
        title: t("partDetails.images.reorderFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set primary image mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/images/${imageId}/primary`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to set primary image");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("partDetails.images.setPrimarySuccess"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["part-images", partSku] });

      // Invalidate both admin and public part details caches
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.adminDetail(partSku),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.publicDetail(partSku),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("partDetails.images.setPrimaryFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      console.log("[DEBUG] Deleting image:", imageId, "from part:", partSku);

      const response = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/images/${imageId}`,
        {
          method: "DELETE",
        }
      );

      console.log("[DEBUG] Delete response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[DEBUG] Delete failed:", errorData);
        throw new Error(errorData.error || "Failed to delete image");
      }

      const result = await response.json();
      console.log("[DEBUG] Delete successful:", result);
      return result;
    },
    onSuccess: (_data, imageId) => {
      console.log(
        "[DEBUG] Delete mutation onSuccess called for imageId:",
        imageId
      );
      toast({
        title: t("common.success"),
        description: t("partDetails.images.deleteSuccess"),
        variant: "success",
      });
      // Invalidate admin part images
      queryClient.invalidateQueries({ queryKey: ["part-images", partSku] });

      // Invalidate both admin and public part details caches
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.adminDetail(partSku),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.publicDetail(partSku),
      });

      // Invalidate public parts list to update primary images in search results
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === "public" && key[1] === "parts" && key[2] === "list";
        },
      });
      console.log("[DEBUG] All queries invalidated after delete");
    },
    onError: (error: Error) => {
      console.error("[DEBUG] Delete mutation onError:", error);
      toast({
        title: t("partDetails.images.deleteFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUploadClick = () => {
    if (isAtMaxCapacity) {
      toast({
        title: t("partDetails.images.limitReached"),
        description: t("partDetails.images.limitDescription"),
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = images?.length || 0;
    const remainingSlots = MAX_IMAGES - currentImageCount;

    // Check if already at limit
    if (remainingSlots <= 0) {
      toast({
        title: t("partDetails.images.limitReached"),
        description: t("partDetails.images.limitDescription"),
        variant: "destructive",
      });
      return;
    }

    // Validate files
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} (not an image)`);
      } else if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large, max 5MB)`);
      } else {
        validFiles.push(file);
      }
    });

    // Limit to remaining slots
    if (validFiles.length > remainingSlots) {
      toast({
        title: t("partDetails.images.tooMany"),
        description: t("partDetails.images.remainingSlots").replace(
          "{{count}}",
          String(remainingSlots)
        ),
        variant: "destructive",
      });
      validFiles.splice(remainingSlots); // Keep only what fits
    }

    if (invalidFiles.length > 0) {
      toast({
        title: t("partDetails.images.filesSkipped"),
        description: invalidFiles.join(", "),
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) return;

    const fileList = new DataTransfer();
    validFiles.forEach((file) => fileList.items.add(file));

    try {
      await uploadMutation.mutateAsync(fileList.files);
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleReorder = (imageIds: string[]) => {
    reorderMutation.mutate(imageIds);
  };

  const handleSetPrimary = (imageId: string) => {
    setPrimaryMutation.mutate(imageId);
  };

  const handleDelete = (imageId: string) => {
    deleteMutation.mutate(imageId);
  };

  return (
    <div data-testid="part-images-section">
      <div className="mb-6" data-testid="part-images-header">
        {/* Mobile Layout - Stacked */}
        <div className="block lg:hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
              <Image className="w-4 h-4 text-white" />
            </div>
            <h2 className="acr-heading-6 text-acr-gray-900">
              {t("partDetails.images.title")}
            </h2>
            <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded-full acr-caption">
              {imageCount}/{MAX_IMAGES}
            </span>
          </div>
          <AcrButton
            variant="primary"
            size="default"
            className="w-full"
            type="button"
            onClick={handleUploadClick}
            disabled={isAtMaxCapacity || uploadMutation.isPending}
          >
            <Plus className="w-4 h-4" />
            {uploadMutation.isPending
              ? t("partDetails.images.uploading")
              : t("partDetails.images.uploadButton")}
          </AcrButton>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
              <Image className="w-4 h-4 text-white" />
            </div>
            <h2 className="acr-heading-6 text-acr-gray-900">
              {t("partDetails.images.title")}
            </h2>
            <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded-full acr-caption">
              {imageCount}/{MAX_IMAGES}
            </span>
          </div>

          <AcrButton
            variant="primary"
            size="default"
            type="button"
            onClick={handleUploadClick}
            disabled={isAtMaxCapacity || uploadMutation.isPending}
          >
            <Plus className="w-4 h-4" />
            {uploadMutation.isPending
              ? t("partDetails.images.uploading")
              : t("partDetails.images.uploadButton")}
          </AcrButton>
        </div>
      </div>

      <div data-testid="part-images-content">
        {imageCount === 0 ? (
          // Empty state
          <div
            className="flex items-center justify-center py-12 border-2 border-dashed border-acr-gray-200 rounded-lg"
            data-testid="part-images-empty-state"
          >
            <div className="text-center">
              <Upload className="w-12 h-12 text-acr-gray-400 mx-auto mb-4" />
              <h3 className="acr-heading-6 text-acr-gray-900 mb-2">
                {t("partDetails.images.emptyTitle")}
              </h3>
              <p className="text-sm text-acr-gray-500 mb-4">
                {t("partDetails.images.emptyDescription")}
              </p>
              <AcrButton
                variant="primary"
                size="default"
                type="button"
                onClick={handleUploadClick}
                disabled={uploadMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("partDetails.images.uploadFirst")}
              </AcrButton>
            </div>
          </div>
        ) : (
          // Image gallery
          <ImageGalleryEditor
            images={images || []}
            onReorder={handleReorder}
            onSetPrimary={handleSetPrimary}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={uploadMutation.isPending || isAtMaxCapacity}
      />
    </div>
  );
}
