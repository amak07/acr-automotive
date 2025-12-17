"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton, AcrCard } from "@/components/acr";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileImage,
  RotateCw,
} from "lucide-react";
import type {
  AnalyzeResult,
  ClassifiedFile,
  ExecuteResult,
} from "@/lib/bulk-upload/types";

interface StageProgressProps {
  analyzeResult: AnalyzeResult;
  rawFiles: File[];
  classifiedFiles: ClassifiedFile[];
  onComplete: () => void;
}

// Concurrency limit for parallel uploads
const UPLOAD_CONCURRENCY = 3;

export function StageProgress({
  analyzeResult,
  rawFiles,
  classifiedFiles,
  onComplete,
}: StageProgressProps) {
  const { t } = useLocale();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPart, setCurrentPart] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  // Start upload automatically (guarded against React StrictMode double-mount)
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startUpload();
  }, []);

  // Upload instruction type
  interface UploadInstruction {
    partId: string;
    acrSku: string;
    filename: string;
    type: "product" | "360-frame";
    frameNumber?: number;
    viewType?: "front" | "top" | "bottom" | "other" | "generic";
  }

  // Upload a single part
  const uploadPart = async (
    part: (typeof analyzeResult.matchedParts)[0],
    fileMap: Map<string, File>
  ): Promise<ExecuteResult["results"][0]> => {
    const instructions: UploadInstruction[] = [];

    // Add product images
    for (const img of part.productImages) {
      instructions.push({
        partId: part.partId,
        acrSku: part.acrSku,
        filename: img.filename,
        type: "product",
        viewType: img.viewType,
      });
    }

    // Add 360 frames
    for (const frame of part.frames360) {
      instructions.push({
        partId: part.partId,
        acrSku: part.acrSku,
        filename: frame.filename,
        type: "360-frame",
        frameNumber: frame.frameNumber,
      });
    }

    if (instructions.length === 0) {
      return {
        partId: part.partId,
        acrSku: part.acrSku,
        success: true,
        imagesUploaded: 0,
        frames360Uploaded: 0,
      };
    }

    // Create FormData with files for this part only
    const formData = new FormData();
    formData.append("instructions", JSON.stringify(instructions));

    // Add only files needed for this part
    for (const inst of instructions) {
      const file = fileMap.get(inst.filename);
      if (file) {
        formData.append(`file_${file.name}`, file);
      }
    }

    try {
      const response = await fetch("/api/admin/bulk-image-upload/execute", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          partId: part.partId,
          acrSku: part.acrSku,
          success: false,
          imagesUploaded: 0,
          frames360Uploaded: 0,
          error: errorData.error || "Upload failed",
        };
      }

      const partResult: ExecuteResult = await response.json();
      // Return the first result (there should only be one per part)
      return (
        partResult.results[0] || {
          partId: part.partId,
          acrSku: part.acrSku,
          success: true,
          imagesUploaded: partResult.summary.totalImagesUploaded,
          frames360Uploaded: partResult.summary.total360FramesUploaded,
        }
      );
    } catch (partError) {
      return {
        partId: part.partId,
        acrSku: part.acrSku,
        success: false,
        imagesUploaded: 0,
        frames360Uploaded: 0,
        error: partError instanceof Error ? partError.message : "Upload failed",
      };
    }
  };

  const startUpload = async () => {
    setIsUploading(true);
    setProgress(0);
    setCompletedCount(0);
    setError(null);

    try {
      const parts = analyzeResult.matchedParts;
      const totalParts = parts.length;

      // Create a map of filename -> File for quick lookup
      const fileMap = new Map<string, File>();
      for (const file of rawFiles) {
        fileMap.set(file.name, file);
      }

      // Process parts with concurrency limit
      const allResults: ExecuteResult["results"] = [];
      let completed = 0;

      // Process in batches of UPLOAD_CONCURRENCY
      for (let i = 0; i < parts.length; i += UPLOAD_CONCURRENCY) {
        const batch = parts.slice(i, i + UPLOAD_CONCURRENCY);

        // Update current part display (show first of batch)
        setCurrentPart(batch[0]?.acrSku || null);

        // Upload batch in parallel
        const batchResults = await Promise.all(
          batch.map((part) => uploadPart(part, fileMap))
        );

        allResults.push(...batchResults);
        completed += batch.length;
        setCompletedCount(completed);
        setProgress(Math.round((completed / totalParts) * 100));
      }

      // Build final result
      let totalImagesUploaded = 0;
      let total360FramesUploaded = 0;
      for (const r of allResults) {
        totalImagesUploaded += r.imagesUploaded;
        total360FramesUploaded += r.frames360Uploaded;
      }

      const finalResult: ExecuteResult = {
        success: allResults.every((r) => r.success),
        results: allResults,
        summary: {
          totalParts: allResults.length,
          successfulParts: allResults.filter((r) => r.success).length,
          failedParts: allResults.filter((r) => !r.success).length,
          totalImagesUploaded,
          total360FramesUploaded,
        },
      };

      setResult(finalResult);
      setProgress(100);
      setCurrentPart(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Show uploading state
  if (isUploading) {
    const totalParts = analyzeResult.matchedParts.length;

    return (
      <div className="space-y-6 py-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-acr-red-500" />
          <h3 className="acr-heading-5 text-acr-gray-800">
            {t("admin.bulkUpload.uploading")}
          </h3>
          <p className="acr-body text-acr-gray-500">
            {currentPart ? (
              <>
                Processing{" "}
                <span className="font-mono font-semibold text-acr-red-600">
                  {currentPart}
                </span>
              </>
            ) : (
              t("admin.bulkUpload.processingFiles")
            )}
          </p>
          <p className="acr-body-small text-acr-gray-400">
            {completedCount} of {totalParts} parts completed
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <div className="h-3 bg-acr-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-acr-red-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center acr-body-small text-acr-gray-500">
            {progress}%
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 py-8">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 mx-auto text-red-600" />
          <h3 className="acr-heading-5 text-red-700">
            {t("admin.bulkUpload.uploadFailed")}
          </h3>
          <p className="acr-body text-acr-gray-500">{error}</p>
        </div>

        <div className="flex justify-center gap-4">
          <AcrButton variant="secondary" onClick={onComplete}>
            {t("admin.bulkUpload.close")}
          </AcrButton>
          <AcrButton variant="primary" onClick={startUpload}>
            {t("admin.bulkUpload.retry")}
          </AcrButton>
        </div>
      </div>
    );
  }

  // Show results
  if (result) {
    const { summary, results } = result;
    const successfulResults = results.filter((r) => r.success);
    const failedResults = results.filter((r) => !r.success);

    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4 py-4">
          {summary.failedParts === 0 ? (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <h3 className="acr-heading-5 text-green-700">
                {t("admin.bulkUpload.uploadComplete")}
              </h3>
            </>
          ) : (
            <>
              <div className="h-12 w-12 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="acr-heading-5 text-yellow-700">
                {t("admin.bulkUpload.uploadPartial")}
              </h3>
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AcrCard variant="default" padding="sm" className="text-center">
            <p className="acr-heading-4 text-green-600">
              {summary.successfulParts}
            </p>
            <p className="acr-caption text-acr-gray-500">
              {t("admin.bulkUpload.partsSuccessful")}
            </p>
          </AcrCard>
          <AcrCard variant="default" padding="sm" className="text-center">
            <p className="acr-heading-4 text-blue-600">
              {summary.totalImagesUploaded}
            </p>
            <p className="acr-caption text-acr-gray-500">
              {t("admin.bulkUpload.imagesUploaded")}
            </p>
          </AcrCard>
          <AcrCard variant="default" padding="sm" className="text-center">
            <p className="acr-heading-4 text-purple-600">
              {summary.total360FramesUploaded}
            </p>
            <p className="acr-caption text-acr-gray-500">
              {t("admin.bulkUpload.frames360")}
            </p>
          </AcrCard>
          {summary.failedParts > 0 && (
            <AcrCard
              variant="default"
              padding="sm"
              className="text-center border-red-300"
            >
              <p className="acr-heading-4 text-red-600">
                {summary.failedParts}
              </p>
              <p className="acr-caption text-acr-gray-500">
                {t("admin.bulkUpload.partsFailed")}
              </p>
            </AcrCard>
          )}
        </div>

        {/* Successful uploads */}
        {successfulResults.length > 0 && (
          <AcrCard variant="default" padding="default">
            <h4 className="acr-heading-6 text-acr-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t("admin.bulkUpload.successfulUploads")}
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {successfulResults.map((r) => (
                <div
                  key={r.partId}
                  className="flex items-center justify-between py-2 border-b border-acr-gray-200 last:border-0"
                >
                  <span className="bg-acr-red-50 text-acr-red-700 px-2 py-1 rounded font-mono font-semibold acr-body-small">
                    {r.acrSku}
                  </span>
                  <div className="flex items-center gap-3">
                    {r.imagesUploaded > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <FileImage className="h-3 w-3" />
                        {r.imagesUploaded}
                      </Badge>
                    )}
                    {r.frames360Uploaded > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <RotateCw className="h-3 w-3" />
                        {r.frames360Uploaded}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AcrCard>
        )}

        {/* Failed uploads */}
        {failedResults.length > 0 && (
          <AcrCard
            variant="default"
            padding="default"
            className="border-red-200 bg-red-50"
          >
            <h4 className="acr-heading-6 text-red-700 mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {t("admin.bulkUpload.failedUploads")}
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {failedResults.map((r) => (
                <div
                  key={r.partId}
                  className="flex items-center justify-between py-2 border-b border-red-200 last:border-0"
                >
                  <span className="bg-acr-red-50 text-acr-red-700 px-2 py-1 rounded font-mono font-semibold acr-body-small">
                    {r.acrSku}
                  </span>
                  <span className="acr-body-small text-red-600">{r.error}</span>
                </div>
              ))}
            </div>
          </AcrCard>
        )}

        {/* Done button */}
        <div className="flex justify-center">
          <AcrButton variant="primary" size="lg" onClick={onComplete}>
            {t("admin.bulkUpload.done")}
          </AcrButton>
        </div>
      </div>
    );
  }

  return null;
}
