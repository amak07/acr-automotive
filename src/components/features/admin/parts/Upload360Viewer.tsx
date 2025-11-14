"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCw,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/common/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton } from "@/components/acr";
import { Part360Viewer } from "@/components/features/public/parts/Part360Viewer";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Upload360ViewerProps {
  partSku: string;
}

interface Frame360 {
  id: string;
  frame_number: number;
  image_url: string;
  width: number;
  height: number;
  file_size_bytes: number;
}

interface PreviewFile {
  id: string;
  file: File;
  preview: string;
  selected: boolean;
}

/**
 * Sortable preview item component
 */
function SortablePreviewItem({
  previewFile,
  index,
  onToggle,
}: {
  previewFile: PreviewFile;
  index: number;
  onToggle: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: previewFile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = previewFile.selected;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white border-2 rounded-lg overflow-hidden transition-all ${
        isDragging
          ? "opacity-50 border-blue-500 shadow-lg scale-105"
          : isSelected
            ? "opacity-100 border-acr-gray-200 hover:border-blue-500 hover:shadow-md"
            : "opacity-50 border-dashed border-acr-gray-300"
      }`}
    >
      {/* Preview image - draggable area */}
      <div className="relative aspect-square bg-acr-gray-100">
        {/* Draggable overlay */}
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing focus:outline-none"
          {...attributes}
          {...listeners}
        >
          <img
            src={previewFile.preview}
            alt={`Frame ${index}`}
            className={`w-full h-full object-cover transition-all ${
              isSelected ? "" : "grayscale"
            }`}
          />
        </div>

        {/* Dark overlay at top for better checkbox visibility */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        {/* Checkbox - outside draggable area */}
        <label
          className="absolute top-2 left-2 z-10 cursor-pointer flex items-center gap-1 bg-white/90 rounded px-2 py-1 hover:bg-white transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggle(previewFile.id);
            }}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-xs font-bold text-acr-gray-900">#{index}</span>
        </label>
      </div>

      {/* File name */}
      <div className="p-2 bg-white">
        <p
          className={`text-xs truncate transition-colors ${
            isSelected ? "text-acr-gray-600" : "text-acr-gray-400"
          }`}
        >
          {previewFile.file.name}
        </p>
      </div>
    </div>
  );
}

/**
 * Upload interface for 360° viewer frames
 * Follows all-or-nothing approach: upload all frames at once or delete entire viewer
 */
export function Upload360Viewer({ partSku }: Upload360ViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [uploadingFrameCount, setUploadingFrameCount] = useState<number | null>(
    null
  );
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);

  const MIN_FRAMES = 12;
  const RECOMMENDED_FRAMES = 24;
  const MAX_FRAMES = 48;

  // Scroll to viewer section
  const scrollToViewer = () => {
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // DND sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch existing 360° frames
  const { data: framesData } = useQuery({
    queryKey: ["part-360-frames", partSku],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/360-frames`
      );
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

      setUploadingFrameCount(files.length);

      const response = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/360-frames`,
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
      setUploadingFrameCount(null);

      const successMsg = t("partDetails.viewer360.uploadSuccess").replace(
        "{{count}}",
        String(data.frameCount)
      );

      toast({
        title: t("common.success"),
        description: successMsg,
        variant: "success",
      });

      queryClient.invalidateQueries({ queryKey: ["part-360-frames", partSku] });
      queryClient.invalidateQueries({
        queryKey: ["part-360-frames-public", partSku],
      });
      // Invalidate public parts queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === "public" && key[1] === "parts";
        },
      });

      // Scroll back to viewer section
      setTimeout(() => scrollToViewer(), 100);
    },
    onError: (error: Error) => {
      setUploadingFrameCount(null);
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
      const response = await fetch(
        `/api/admin/parts/${encodeURIComponent(partSku)}/360-frames`,
        {
          method: "DELETE",
        }
      );

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
      queryClient.invalidateQueries({ queryKey: ["part-360-frames", partSku] });
      queryClient.invalidateQueries({
        queryKey: ["part-360-frames-public", partSku],
      });
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Helper to reset input (allows re-selecting same files)
    const resetInput = () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    // Validation: File types and sizes
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(
          `${file.name} (${t("partDetails.viewer360.invalidFileType")})`
        );
      } else if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(
          `${file.name} (${t("partDetails.viewer360.fileSizeError")})`
        );
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

    if (validFiles.length === 0) {
      resetInput();
      return;
    }

    // Create preview files with object URLs - all selected by default
    const previews: PreviewFile[] = validFiles.map((file, index) => ({
      id: `${index}-${file.name}`,
      file,
      preview: URL.createObjectURL(file),
      selected: true,
    }));

    setPreviewFiles(previews);
    resetInput();
  };

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPreviewFiles((files) => {
        const oldIndex = files.findIndex((f) => f.id === active.id);
        const newIndex = files.findIndex((f) => f.id === over.id);
        return arrayMove(files, oldIndex, newIndex);
      });
    }
  };

  // Upload only the selected files
  const handleConfirmUpload = async () => {
    const selectedFiles = previewFiles.filter((f) => f.selected);

    if (selectedFiles.length === 0) return;

    // Validate minimum frame count
    if (selectedFiles.length < MIN_FRAMES) {
      toast({
        title: t("partDetails.viewer360.validationError"),
        description: t("partDetails.viewer360.minFramesError").replace(
          "{{min}}",
          String(MIN_FRAMES)
        ),
        variant: "destructive",
      });
      return;
    }

    const fileList = new DataTransfer();
    selectedFiles.forEach((pf) => fileList.items.add(pf.file));

    try {
      await uploadMutation.mutateAsync(fileList.files);
      // Cleanup ALL preview URLs (including unselected)
      previewFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
      setPreviewFiles([]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Cancel preview and clear
  const handleCancelPreview = () => {
    // Cleanup preview URLs
    previewFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
    setPreviewFiles([]);

    // Scroll back to viewer section
    setTimeout(() => scrollToViewer(), 100);
  };

  // Toggle selection state of a preview file
  const handleTogglePreview = (id: string) => {
    setPreviewFiles((files) =>
      files.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const handleDelete = async () => {
    const confirmed = confirm(t("partDetails.viewer360.deleteConfirm"));
    if (!confirmed) return;

    deleteMutation.mutate();
  };

  return (
    <div ref={containerRef} data-testid="part-360-viewer-section">
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
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
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <AcrButton
                    variant="secondary"
                    size="sm"
                    onClick={handleUploadClick}
                    disabled={
                      uploadMutation.isPending || deleteMutation.isPending
                    }
                    className="w-full sm:w-auto"
                  >
                    {t("partDetails.viewer360.replaceButton")}
                  </AcrButton>
                  <AcrButton
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={
                      deleteMutation.isPending || uploadMutation.isPending
                    }
                    className="w-full sm:w-auto"
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
            </div>

            {/* Interactive 360° viewer preview */}
            {frames.length > 0 && (
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <Part360Viewer
                    frameUrls={frames.map((f) => f.image_url)}
                    alt={t("partDetails.viewer360.previewAlt")}
                    enableFullscreen={true}
                  />
                </div>
              </div>
            )}
          </div>
        ) : previewFiles.length > 0 ? (
          // Preview grid with reordering
          <div className="space-y-4">
            {/* Warning banners - TOP */}
            {(() => {
              const selectedCount = previewFiles.filter(
                (f) => f.selected
              ).length;

              if (selectedCount < MIN_FRAMES) {
                return (
                  <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 sm:p-5 shadow-md">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-bold text-red-900 mb-1">
                          ⚠️ Upload Blocked
                        </p>
                        <p className="text-xs sm:text-sm text-red-800 mb-2">
                          {t("partDetails.viewer360.minFramesError").replace(
                            "{{count}}",
                            String(MIN_FRAMES)
                          )}
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-red-700">
                          Selected: {selectedCount} / {MIN_FRAMES} minimum
                          required
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else if (selectedCount < RECOMMENDED_FRAMES) {
                return (
                  <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-3 sm:p-5 shadow-md">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-bold text-yellow-900 mb-1">
                          ⚡ Below Recommended
                        </p>
                        <p className="text-xs sm:text-sm text-yellow-800 mb-2">
                          {t(
                            "partDetails.viewer360.recommendedWarning"
                          ).replace("{{count}}", String(RECOMMENDED_FRAMES))}
                        </p>
                        <p className="text-xs text-yellow-700">
                          {selectedCount} / {RECOMMENDED_FRAMES} recommended •{" "}
                          {t("partDetails.viewer360.dragToReorder")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Good state - 24+ frames
                return (
                  <div className="bg-green-100 border-2 border-green-500 rounded-lg p-3 sm:p-5 shadow-md">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-bold text-green-900 mb-1">
                          ✓ Ready to Upload
                        </p>
                        <p className="text-xs sm:text-sm text-green-700 mb-1">
                          {selectedCount} of {previewFiles.length} frames
                          selected
                        </p>
                        <p className="text-xs text-green-700">
                          {t("partDetails.viewer360.reorderInstructions")} •{" "}
                          {t("partDetails.viewer360.dragToReorder")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            })()}

            {/* Sortable grid */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={previewFiles.map((f) => f.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {previewFiles.map((pf, index) => (
                    <SortablePreviewItem
                      key={pf.id}
                      previewFile={pf}
                      index={index}
                      onToggle={handleTogglePreview}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Upload progress indicator */}
            {uploadMutation.isPending && uploadingFrameCount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      {t("partDetails.viewer360.uploading")}{" "}
                      {uploadingFrameCount} {t("partDetails.viewer360.frames")}
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Processing and optimizing images...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <AcrButton
                variant="secondary"
                size="default"
                type="button"
                onClick={handleCancelPreview}
                disabled={uploadMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </AcrButton>
              <AcrButton
                variant="primary"
                size="default"
                type="button"
                onClick={handleConfirmUpload}
                disabled={
                  uploadMutation.isPending ||
                  previewFiles.filter((f) => f.selected).length < MIN_FRAMES
                }
                className="w-full sm:w-auto"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("partDetails.viewer360.uploading")}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t("partDetails.viewer360.confirmUpload")} (
                    {previewFiles.filter((f) => f.selected).length})
                  </>
                )}
              </AcrButton>
            </div>
          </div>
        ) : (
          // Empty state - no files selected
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
              onClick={handleUploadClick}
            >
              <Upload className="mx-auto h-12 w-12 text-acr-gray-400" />
              <p className="mt-2 text-sm text-acr-gray-600">
                {t("partDetails.viewer360.dragToUpload")}
              </p>
              <p className="text-xs text-acr-gray-500 mt-1">
                {t("partDetails.viewer360.imageRequirements")}
              </p>
            </div>

            {/* Requirements */}
            <div className="text-xs text-acr-gray-600 space-y-1 bg-blue-50 p-4 rounded-lg">
              <p className="font-medium">
                {t("partDetails.viewer360.requirementsTitle")}
              </p>
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
        onChange={handleFileSelect}
        disabled={uploadMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
