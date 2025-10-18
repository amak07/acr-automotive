"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCw, Upload, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/common/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton } from "@/components/acr";

interface Upload360ViewerProps {
  partId: string;
}

interface Frame360 {
  id: string;
  frame_number: number;
  image_url: string;
  width: number;
  height: number;
  file_size_bytes: number;
}

/**
 * Upload interface for 360° viewer frames
 * Follows all-or-nothing approach: upload all frames at once or delete entire viewer
 */
export function Upload360Viewer({ partId }: Upload360ViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const MIN_FRAMES = 12;
  const RECOMMENDED_FRAMES = 24;
  const MAX_FRAMES = 48;

  // Fetch existing 360° frames
  const { data: framesData } = useQuery({
    queryKey: ["part-360-frames", partId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/parts/${partId}/360-frames`);
      if (!res.ok) throw new Error("Failed to fetch 360 frames");
      return res.json() as Promise<{ frames: Frame360[]; count: number }>;
    },
  });

  const frames = framesData?.frames || [];
  const frameCount = framesData?.count || 0;
  const has360Viewer = frameCount > 0;

  // Upload frames mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        formData.append(`frame${index}`, file);
      });

      setUploadProgress({ current: 0, total: files.length });

      const response = await fetch(`/api/admin/parts/${partId}/360-frames`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadProgress(null);

      const successMsg = t("partDetails.viewer360.uploadSuccess").replace(
        "{{count}}",
        String(data.frameCount)
      );

      toast({
        title: t("common.success"),
        description: data.warning
          ? `${successMsg}. ${data.warning}`
          : successMsg,
        variant: data.warning ? ("default" as any) : ("success" as any),
      });

      queryClient.invalidateQueries({ queryKey: ["part-360-frames", partId] });
      // Invalidate public parts queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === "public" && key[1] === "parts";
        },
      });
    },
    onError: (error: Error) => {
      setUploadProgress(null);
      toast({
        title: t("common.error.title"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete viewer mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/parts/${partId}/360-frames`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Delete failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("partDetails.viewer360.deleteSuccess"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["part-360-frames", partId] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === "public" && key[1] === "parts";
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validation: Minimum frames
    if (files.length < MIN_FRAMES) {
      toast({
        title: t("partDetails.viewer360.minFramesError").replace(
          "{{count}}",
          String(MIN_FRAMES)
        ),
        description: t("partDetails.viewer360.currentCount").replace(
          "{{count}}",
          String(files.length)
        ),
        variant: "destructive",
      });
      return;
    }

    // Validation: Maximum frames
    if (files.length > MAX_FRAMES) {
      toast({
        title: t("partDetails.viewer360.maxFramesError").replace(
          "{{count}}",
          String(MAX_FRAMES)
        ),
        description: t("partDetails.viewer360.currentCount").replace(
          "{{count}}",
          String(files.length)
        ),
        variant: "destructive",
      });
      return;
    }

    // Validation: File types and sizes
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} (${t("partDetails.viewer360.invalidFileType")})`);
      } else if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (${t("partDetails.viewer360.fileSizeError")})`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: t("partDetails.viewer360.filesSkipped"),
        description: invalidFiles.join(", "),
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) return;

    // Show warning for suboptimal count
    if (validFiles.length < RECOMMENDED_FRAMES) {
      const proceed = confirm(
        t("partDetails.viewer360.recommendedWarning")
          .replace("{{count}}", String(RECOMMENDED_FRAMES))
          + "\n\n" +
          t("partDetails.viewer360.proceedQuestion")
      );
      if (!proceed) return;
    }

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

  const handleDelete = async () => {
    const confirmed = confirm(t("partDetails.viewer360.deleteConfirm"));
    if (!confirmed) return;

    deleteMutation.mutate();
  };

  return (
    <div data-testid="part-360-viewer-section">
      <div className="mb-6" data-testid="part-360-viewer-header">
        {/* Mobile Layout - Stacked */}
        <div className="block lg:hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <RotateCw className="w-4 h-4 text-white" />
            </div>
            <h2 className="acr-heading-6 text-acr-gray-900">
              {t("partDetails.viewer360.title")}
            </h2>
            {has360Viewer && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full acr-caption">
                {frameCount} {t("partDetails.viewer360.frames")}
              </span>
            )}
          </div>
          {!has360Viewer && (
            <AcrButton
              variant="primary"
              size="default"
              className="w-full"
              type="button"
              onClick={handleUploadClick}
              disabled={uploadMutation.isPending}
            >
              <Plus className="w-4 h-4" />
              {uploadMutation.isPending
                ? t("partDetails.viewer360.uploading")
                : t("partDetails.viewer360.uploadButton")}
            </AcrButton>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <RotateCw className="w-4 h-4 text-white" />
            </div>
            <h2 className="acr-heading-6 text-acr-gray-900">
              {t("partDetails.viewer360.title")}
            </h2>
            {has360Viewer && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full acr-caption">
                {frameCount} {t("partDetails.viewer360.frames")}
              </span>
            )}
          </div>

          {!has360Viewer && (
            <AcrButton
              variant="primary"
              size="default"
              type="button"
              onClick={handleUploadClick}
              disabled={uploadMutation.isPending}
            >
              <Plus className="w-4 h-4" />
              {uploadMutation.isPending
                ? t("partDetails.viewer360.uploading")
                : t("partDetails.viewer360.uploadButton")}
            </AcrButton>
          )}
        </div>
      </div>

      <div data-testid="part-360-viewer-content">
        {has360Viewer ? (
          // Active state - 360° viewer configured
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    {t("partDetails.viewer360.activeTitle")}
                  </p>
                  <p className="text-sm text-green-700">
                    {t("partDetails.viewer360.activeDescription").replace(
                      "{{count}}",
                      String(frameCount)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <AcrButton
                  variant="secondary"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={uploadMutation.isPending || deleteMutation.isPending}
                >
                  {t("partDetails.viewer360.replaceButton")}
                </AcrButton>
                <AcrButton
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending || uploadMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("partDetails.viewer360.deleteButton")}
                    </>
                  )}
                </AcrButton>
              </div>
            </div>

            {/* Preview thumbnail */}
            {frames.length > 0 && (
              <div className="flex justify-center">
                <img
                  src={frames[0].image_url}
                  alt={t("partDetails.viewer360.previewAlt")}
                  className="max-w-xs rounded-lg border border-acr-gray-200"
                />
              </div>
            )}
          </div>
        ) : (
          // Empty state
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
              onClick={handleUploadClick}
            >
              {uploadMutation.isPending && uploadProgress ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                  <p className="mt-2 text-sm">
                    {t("partDetails.viewer360.uploadProgress")
                      .replace("{{current}}", String(uploadProgress.current))
                      .replace("{{total}}", String(uploadProgress.total))
                      .replace(
                        "{{percent}}",
                        String(Math.round((uploadProgress.current / uploadProgress.total) * 100))
                      )}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-acr-gray-400" />
                  <p className="mt-2 text-sm text-acr-gray-600">
                    {t("partDetails.viewer360.dragToUpload")}
                  </p>
                  <p className="text-xs text-acr-gray-500 mt-1">
                    {t("partDetails.viewer360.imageRequirements")}
                  </p>
                </>
              )}
            </div>

            {/* Requirements */}
            <div className="text-xs text-acr-gray-600 space-y-1 bg-blue-50 p-4 rounded-lg">
              <p className="font-medium">{t("partDetails.viewer360.requirementsTitle")}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  {t("partDetails.viewer360.frameCountRequirement")
                    .replace("{{min}}", String(MIN_FRAMES))
                    .replace("{{max}}", String(MAX_FRAMES))
                    .replace("{{recommended}}", String(RECOMMENDED_FRAMES))}
                </li>
                <li>{t("partDetails.viewer360.fileTypeRequirement")}</li>
                <li>{t("partDetails.viewer360.fileSizeRequirement")}</li>
                <li>{t("partDetails.viewer360.sequentialRequirement")}</li>
              </ul>
            </div>
          </div>
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
        disabled={uploadMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
