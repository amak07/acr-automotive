"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AcrButton, AcrCard } from "@/components/acr";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/hooks/common/use-toast";
import {
  Upload,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { extractFullSkuFromFilename } from "./utils/sku-extractor";

interface Bulk360UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface Classified360File {
  file: File;
  filename: string;
  extractedSku: string | null;
  frameNumber: number | null;
}

interface SkuGroup {
  sku: string;
  files: Classified360File[];
  existsInDb: boolean;
  currentFrameCount: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

type UploadStage = "select" | "review" | "uploading" | "complete";

const MIN_FRAMES = 12;

/**
 * Extract SKU and frame number from 360 frame filename
 * Handles patterns like: ACR2302007_1.jpg, ACR2302007_24.jpg
 */
function classify360File(file: File): Classified360File {
  const filename = file.name;
  const extractedSku = extractFullSkuFromFilename(filename);

  // Try to extract frame number from filename
  // Pattern: SKU_N.jpg where N is 1-99
  let frameNumber: number | null = null;
  const frameMatch = filename.match(/_(\d{1,2})\.(jpg|jpeg|png|webp)$/i);
  if (frameMatch) {
    frameNumber = parseInt(frameMatch[1], 10);
  }

  return {
    file,
    filename,
    extractedSku,
    frameNumber,
  };
}

/**
 * Group classified files by SKU
 * Only includes files with valid frame numbers (filters out product images like _fro, _bot, etc.)
 */
function groupFilesBySku(
  files: Classified360File[]
): Map<string, Classified360File[]> {
  const groups = new Map<string, Classified360File[]>();

  for (const file of files) {
    // Only include files with extracted SKU AND a valid frame number
    // This filters out product images like _fro.jpg, _bot.jpg, _top.jpg, _oth.jpg
    if (!file.extractedSku || file.frameNumber === null) continue;

    const existing = groups.get(file.extractedSku) || [];
    existing.push(file);
    groups.set(file.extractedSku, existing);
  }

  // Sort files within each group by frame number
  for (const [sku, skuFiles] of groups) {
    skuFiles.sort((a, b) => (a.frameNumber || 0) - (b.frameNumber || 0));
    groups.set(sku, skuFiles);
  }

  return groups;
}

export function Bulk360UploadModal({
  open,
  onOpenChange,
  onComplete,
}: Bulk360UploadModalProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [stage, setStage] = useState<UploadStage>("select");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [classifiedFiles, setClassifiedFiles] = useState<Classified360File[]>(
    []
  );
  const [skuGroups, setSkuGroups] = useState<SkuGroup[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  // Reset state when modal closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setStage("select");
        setSelectedFiles([]);
        setClassifiedFiles([]);
        setSkuGroups([]);
        setIsAnalyzing(false);
        setUploadProgress({ current: 0, total: 0 });
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Dropzone for file selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter to only image files
    const imageFiles = acceptedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    // Classify each file
    const classified = imageFiles.map((file) => classify360File(file));

    setSelectedFiles(imageFiles);
    setClassifiedFiles(classified);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
    },
    multiple: true,
  });

  // Clear selected files
  const handleClear = () => {
    setSelectedFiles([]);
    setClassifiedFiles([]);
  };

  // Analyze files and check which SKUs exist in database
  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    try {
      // Group files by SKU
      const grouped = groupFilesBySku(classifiedFiles);

      // Check which SKUs exist in database
      const res = await fetch(
        `/api/admin/parts?search=&limit=1000&include_image_stats=true`
      );
      if (!res.ok) throw new Error("Failed to fetch parts");
      const data = await res.json();

      // Create a map of existing parts
      const existingParts = new Map<
        string,
        { has_360_viewer: boolean; viewer_360_frame_count: number }
      >();
      for (const part of data.data) {
        existingParts.set(part.acr_sku, {
          has_360_viewer: part.has_360_viewer || false,
          viewer_360_frame_count: part.viewer_360_frame_count || 0,
        });
      }

      // Build SKU groups with status
      const groups: SkuGroup[] = [];
      for (const [sku, files] of grouped) {
        const partInfo = existingParts.get(sku);
        groups.push({
          sku,
          files,
          existsInDb: !!partInfo,
          currentFrameCount: partInfo?.viewer_360_frame_count || 0,
          status: "pending",
        });
      }

      // Sort by SKU
      groups.sort((a, b) => a.sku.localeCompare(b.sku));

      setSkuGroups(groups);
      setStage("review");
    } catch {
      toast({
        title: t("common.error.title"),
        description: "Failed to analyze files",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Upload all 360 viewers
  const handleUpload = async () => {
    const validGroups = skuGroups.filter(
      (g) => g.existsInDb && g.files.length >= MIN_FRAMES
    );

    if (validGroups.length === 0) {
      toast({
        title: "No valid uploads",
        description:
          "No SKUs have enough frames (minimum 12) or exist in database",
        variant: "destructive",
      });
      return;
    }

    setStage("uploading");
    setUploadProgress({ current: 0, total: validGroups.length });

    // Update all to uploading status
    setSkuGroups((prev) =>
      prev.map((g) =>
        validGroups.includes(g) ? { ...g, status: "uploading" as const } : g
      )
    );

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validGroups.length; i++) {
      const group = validGroups[i];
      setUploadProgress({ current: i + 1, total: validGroups.length });

      try {
        const formData = new FormData();
        group.files.forEach((f, index) => {
          formData.append(`frame${index}`, f.file);
        });

        const response = await fetch(
          `/api/admin/parts/${encodeURIComponent(group.sku)}/360-frames`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        // Update status to success
        setSkuGroups((prev) =>
          prev.map((g) =>
            g.sku === group.sku ? { ...g, status: "success" as const } : g
          )
        );
        successCount++;

        // Invalidate queries for this part
        queryClient.invalidateQueries({
          queryKey: ["part-360-frames", group.sku],
        });
      } catch (error) {
        // Update status to error
        setSkuGroups((prev) =>
          prev.map((g) =>
            g.sku === group.sku
              ? {
                  ...g,
                  status: "error" as const,
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : g
          )
        );
        errorCount++;
      }
    }

    // Invalidate parts list
    queryClient.invalidateQueries({ queryKey: ["admin", "parts"] });

    setStage("complete");

    toast({
      title: successCount > 0 ? t("common.success") : t("common.error.title"),
      description: `Uploaded ${successCount} 360° viewers${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
      variant: successCount > 0 ? "success" : "destructive",
    });
  };

  // Get stage title
  const getStageTitle = () => {
    switch (stage) {
      case "select":
        return t("admin.bulkUpload.360.selectTitle");
      case "review":
        return t("admin.bulkUpload.360.reviewTitle");
      case "uploading":
        return t("admin.bulkUpload.360.uploadingTitle");
      case "complete":
        return t("admin.bulkUpload.360.completeTitle");
    }
  };

  // Count stats
  const groupedBySku = groupFilesBySku(classifiedFiles);
  const uniqueSkuCount = groupedBySku.size;
  const totalFrames = classifiedFiles.filter((f) => f.extractedSku).length;
  const unknownCount = classifiedFiles.filter((f) => !f.extractedSku).length;
  const skippedCount = selectedFiles.length - classifiedFiles.length;

  // Review stats
  const validGroups = skuGroups.filter(
    (g) => g.existsInDb && g.files.length >= MIN_FRAMES
  );
  const missingSkuGroups = skuGroups.filter((g) => !g.existsInDb);
  const insufficientFrameGroups = skuGroups.filter(
    (g) => g.existsInDb && g.files.length < MIN_FRAMES
  );

  // Render content based on stage
  const renderContent = () => {
    switch (stage) {
      case "select":
        return (
          <div className="space-y-6">
            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200",
                isDragActive
                  ? "border-acr-red-500 bg-acr-red-50"
                  : "border-acr-gray-300 hover:border-acr-red-300 hover:bg-acr-gray-50"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-acr-gray-100">
                  <Folder className="h-8 w-8 text-acr-gray-500" />
                </div>
                {isDragActive ? (
                  <p className="acr-body text-acr-red-600 font-medium">
                    {t("admin.bulkUpload.360.dropHere")}
                  </p>
                ) : (
                  <>
                    <div>
                      <p className="acr-body text-acr-gray-800 font-medium">
                        {t("admin.bulkUpload.360.dragDrop")}
                      </p>
                      <p className="acr-body-small text-acr-gray-500">
                        {t("admin.bulkUpload.360.orBrowse")}
                      </p>
                    </div>
                    <AcrButton variant="secondary" type="button">
                      <Upload className="h-4 w-4" />
                      {t("admin.bulkUpload.selectFiles")}
                    </AcrButton>
                  </>
                )}
              </div>
            </div>

            {/* File Summary */}
            {selectedFiles.length > 0 && (
              <AcrCard variant="default" padding="default">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="acr-heading-6 text-acr-gray-800">
                    {t("admin.bulkUpload.filesSelected").replace(
                      "{count}",
                      String(selectedFiles.length)
                    )}
                  </h3>
                  <AcrButton variant="ghost" size="sm" onClick={handleClear}>
                    <X className="h-4 w-4" />
                    {t("admin.bulkUpload.clear")}
                  </AcrButton>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* 360 Frames */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-acr-gray-50">
                    <div className="p-2 rounded-full bg-green-100 text-green-600">
                      <RotateCw className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="acr-heading-5 text-acr-gray-800">
                        {totalFrames}
                      </p>
                      <p className="acr-caption text-acr-gray-500">
                        {t("admin.bulkUpload.360.frames")}
                      </p>
                    </div>
                  </div>

                  {/* Unique SKUs */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-acr-gray-50">
                    <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                      <Folder className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="acr-heading-5 text-acr-gray-800">
                        {uniqueSkuCount}
                      </p>
                      <p className="acr-caption text-acr-gray-500">
                        {t("admin.bulkUpload.360.uniqueParts")}
                      </p>
                    </div>
                  </div>

                  {/* Unknown */}
                  {unknownCount > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-acr-gray-50">
                      <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="acr-heading-5 text-acr-gray-800">
                          {unknownCount}
                        </p>
                        <p className="acr-caption text-acr-gray-500">
                          {t("admin.bulkUpload.unknown")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {skippedCount > 0 && (
                  <p className="mt-3 acr-body-small text-acr-gray-500">
                    {t("admin.bulkUpload.360.filesSkipped").replace(
                      "{{count}}",
                      String(skippedCount)
                    )}
                  </p>
                )}
              </AcrCard>
            )}

            {/* Continue Button */}
            <div className="flex justify-end">
              <AcrButton
                variant="primary"
                size="default"
                onClick={handleAnalyze}
                disabled={selectedFiles.length === 0 || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("admin.bulkUpload.analyzing")}
                  </>
                ) : (
                  t("admin.bulkUpload.analyzeFiles")
                )}
              </AcrButton>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="acr-heading-5 text-green-800">
                    {validGroups.length}
                  </p>
                  <p className="acr-caption text-green-600">
                    {t("admin.bulkUpload.360.readyToUpload")}
                  </p>
                </div>
              </div>

              {missingSkuGroups.length > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="acr-heading-5 text-red-800">
                      {missingSkuGroups.length}
                    </p>
                    <p className="acr-caption text-red-600">
                      {t("admin.bulkUpload.360.skuNotFound")}
                    </p>
                  </div>
                </div>
              )}

              {insufficientFrameGroups.length > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="acr-heading-5 text-yellow-800">
                      {insufficientFrameGroups.length}
                    </p>
                    <p className="acr-caption text-yellow-600">
                      {t("admin.bulkUpload.360.lessThanFrames").replace(
                        "{{min}}",
                        String(MIN_FRAMES)
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Parts List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {skuGroups.map((group) => {
                const isValid =
                  group.existsInDb && group.files.length >= MIN_FRAMES;
                const hasExisting = group.currentFrameCount > 0;

                return (
                  <div
                    key={group.sku}
                    className={cn(
                      "p-4 rounded-lg border",
                      isValid
                        ? "bg-white border-green-200"
                        : !group.existsInDb
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-full",
                            isValid
                              ? "bg-green-100 text-green-600"
                              : !group.existsInDb
                                ? "bg-red-100 text-red-600"
                                : "bg-yellow-100 text-yellow-600"
                          )}
                        >
                          <RotateCw className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-acr-gray-900">
                            {group.sku}
                          </p>
                          <p className="text-sm text-acr-gray-600">
                            {t("admin.bulkUpload.360.nFrames").replace(
                              "{{count}}",
                              String(group.files.length)
                            )}
                            {hasExisting &&
                              ` ${t("admin.bulkUpload.360.replacesN").replace("{{count}}", String(group.currentFrameCount))}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isValid ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {t("admin.bulkUpload.360.ready")}
                          </span>
                        ) : !group.existsInDb ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            {t("admin.bulkUpload.360.partNotFound")}
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            {t("admin.bulkUpload.360.needMoreFrames").replace(
                              "{{count}}",
                              String(MIN_FRAMES - group.files.length)
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <AcrButton variant="secondary" onClick={() => setStage("select")}>
                {t("admin.bulkUpload.back")}
              </AcrButton>
              <AcrButton
                variant="primary"
                onClick={handleUpload}
                disabled={validGroups.length === 0}
              >
                {t("admin.bulkUpload.360.uploadN").replace(
                  "{{count}}",
                  String(validGroups.length)
                )}
                {validGroups.length !== 1 ? "s" : ""}
              </AcrButton>
            </div>
          </div>
        );

      case "uploading":
        return (
          <div className="space-y-6">
            {/* Progress */}
            <div className="py-8 text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-acr-red-600 animate-spin" />
              <div>
                <p className="font-medium text-acr-gray-900">
                  {t("admin.bulkUpload.360.uploading")}
                </p>
                <p className="text-sm text-acr-gray-600">
                  {t("admin.bulkUpload.360.nOfNComplete")
                    .replace("{{current}}", String(uploadProgress.current))
                    .replace("{{total}}", String(uploadProgress.total))}
                </p>
              </div>
            </div>

            {/* Status List */}
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {skuGroups
                .filter((g) => g.existsInDb && g.files.length >= MIN_FRAMES)
                .map((group) => (
                  <div
                    key={group.sku}
                    className="flex items-center justify-between p-3 rounded-lg bg-acr-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      {group.status === "uploading" && (
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      )}
                      {group.status === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {group.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      {group.status === "pending" && (
                        <div className="h-4 w-4 rounded-full bg-acr-gray-300" />
                      )}
                      <span className="font-mono text-sm">{group.sku}</span>
                    </div>
                    <span className="text-xs text-acr-gray-500">
                      {t("admin.bulkUpload.360.nFrames").replace(
                        "{{count}}",
                        String(group.files.length)
                      )}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        );

      case "complete":
        const successGroups = skuGroups.filter((g) => g.status === "success");
        const errorGroups = skuGroups.filter((g) => g.status === "error");

        return (
          <div className="space-y-6">
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
              <div>
                <p className="acr-heading-5 text-acr-gray-900">
                  {t("admin.bulkUpload.360.uploadComplete")}
                </p>
                <p className="text-sm text-acr-gray-600 mt-1">
                  {t("admin.bulkUpload.360.nUploaded").replace(
                    "{{count}}",
                    String(successGroups.length)
                  )}
                  {errorGroups.length > 0 &&
                    `, ${t("admin.bulkUpload.360.nFailed").replace("{{count}}", String(errorGroups.length))}`}
                </p>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[250px] overflow-y-auto space-y-2">
              {skuGroups
                .filter((g) => g.status === "success" || g.status === "error")
                .map((group) => (
                  <div
                    key={group.sku}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      group.status === "success" ? "bg-green-50" : "bg-red-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {group.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-mono text-sm">{group.sku}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs",
                        group.status === "success"
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {group.status === "success"
                        ? t("admin.bulkUpload.360.nFrames").replace(
                            "{{count}}",
                            String(group.files.length)
                          )
                        : group.error}
                    </span>
                  </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <AcrButton
                variant="secondary"
                onClick={() => {
                  setStage("select");
                  setSelectedFiles([]);
                  setClassifiedFiles([]);
                  setSkuGroups([]);
                }}
              >
                {t("admin.bulkUpload.360.uploadMore")}
              </AcrButton>
              <AcrButton
                variant="primary"
                onClick={() => {
                  handleOpenChange(false);
                  onComplete();
                }}
              >
                {t("admin.bulkUpload.done")}
              </AcrButton>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5" />
            {getStageTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
