"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton, AcrCard } from "@/components/acr";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileImage,
  RotateCw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AnalyzeResult, ClassifiedFile } from "@/lib/bulk-upload/types";

interface StageReviewProps {
  classifiedFiles: ClassifiedFile[];
  rawFiles: File[];
  onAnalyzeComplete: (result: AnalyzeResult) => void;
  onBack: () => void;
}

export function StageReview({
  classifiedFiles,
  rawFiles,
  onAnalyzeComplete,
  onBack,
}: StageReviewProps) {
  const { t } = useLocale();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showNewParts, setShowNewParts] = useState(true);
  const [showUpdateParts, setShowUpdateParts] = useState(true);

  // Analyze files on mount
  useEffect(() => {
    handleAnalyze();
  }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Prepare classified file data for API (without File objects)
      const classifiedData = classifiedFiles.map((f) => ({
        filename: f.filename,
        type: f.type,
        extractedSku: f.extractedSku,
        frameNumber: f.frameNumber,
        viewType: f.viewType,
      }));

      const response = await fetch("/api/admin/bulk-image-upload/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classifiedFiles: classifiedData }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze files");
      }

      const result: AnalyzeResult = await response.json();
      setAnalyzeResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpload = () => {
    if (analyzeResult) {
      onAnalyzeComplete(analyzeResult);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-acr-red-500" />
            <p className="acr-body text-acr-gray-800 font-medium">
              {t("admin.bulkUpload.analyzing")}
            </p>
            <p className="acr-body-small text-acr-gray-500">
              {t("admin.bulkUpload.matchingSkus")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AcrCard
          variant="default"
          padding="default"
          className="border-red-200 bg-red-50"
        >
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="h-5 w-5" />
            <p className="acr-body font-medium">{error}</p>
          </div>
        </AcrCard>
        <div className="flex justify-between">
          <AcrButton variant="secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            {t("admin.bulkUpload.back")}
          </AcrButton>
          <AcrButton variant="primary" onClick={handleAnalyze}>
            {t("admin.bulkUpload.retry")}
          </AcrButton>
        </div>
      </div>
    );
  }

  if (!analyzeResult) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const { matchedParts, unmatchedFiles, summary } = analyzeResult;
  const newParts = matchedParts.filter((p) => p.isNew);
  const updateParts = matchedParts.filter((p) => !p.isNew);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AcrCard variant="default" padding="sm" className="text-center">
          <p className="acr-heading-4 text-acr-red-600">
            {summary.matchedFiles}
          </p>
          <p className="acr-caption text-acr-gray-500">
            {t("admin.bulkUpload.filesMatched")}
          </p>
        </AcrCard>
        <AcrCard variant="default" padding="sm" className="text-center">
          <p className="acr-heading-4 text-green-600">{summary.partsNew}</p>
          <p className="acr-caption text-acr-gray-500">
            {t("admin.bulkUpload.newParts")}
          </p>
        </AcrCard>
        <AcrCard variant="default" padding="sm" className="text-center">
          <p className="acr-heading-4 text-blue-600">{summary.partsToUpdate}</p>
          <p className="acr-caption text-acr-gray-500">
            {t("admin.bulkUpload.partsToUpdate")}
          </p>
        </AcrCard>
        <AcrCard variant="default" padding="sm" className="text-center">
          <p className="acr-heading-4 text-yellow-600">
            {unmatchedFiles.length}
          </p>
          <p className="acr-caption text-acr-gray-500">
            {t("admin.bulkUpload.unmatched")}
          </p>
        </AcrCard>
      </div>

      {/* New Parts Section */}
      {newParts.length > 0 && (
        <div className="border border-acr-gray-200 rounded-lg bg-white">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-acr-gray-50 transition-colors"
            onClick={() => setShowNewParts(!showNewParts)}
          >
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                {t("admin.bulkUpload.new")}
              </Badge>
              <span className="acr-body text-acr-gray-800 font-medium">
                {t("admin.bulkUpload.partsGettingImages").replace(
                  "{count}",
                  String(newParts.length)
                )}
              </span>
            </div>
            {showNewParts ? (
              <ChevronUp className="h-4 w-4 text-acr-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-acr-gray-500" />
            )}
          </button>
          {showNewParts && (
            <div className="p-4 pt-0 space-y-2">
              {newParts.map((part) => (
                <PartRow key={part.partId} part={part} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Updating Parts Section */}
      {updateParts.length > 0 && (
        <div className="border border-acr-gray-200 rounded-lg bg-white">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-acr-gray-50 transition-colors"
            onClick={() => setShowUpdateParts(!showUpdateParts)}
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {t("admin.bulkUpload.updating")}
              </Badge>
              <span className="acr-body text-acr-gray-800 font-medium">
                {t("admin.bulkUpload.partsWithExisting").replace(
                  "{count}",
                  String(updateParts.length)
                )}
              </span>
            </div>
            {showUpdateParts ? (
              <ChevronUp className="h-4 w-4 text-acr-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-acr-gray-500" />
            )}
          </button>
          {showUpdateParts && (
            <div className="p-4 pt-0 space-y-2">
              {updateParts.map((part) => (
                <PartRow key={part.partId} part={part} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unmatched Files */}
      {unmatchedFiles.length > 0 && (
        <AcrCard
          variant="default"
          padding="default"
          className="border-yellow-200 bg-yellow-50"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="acr-heading-6 text-yellow-800">
              {t("admin.bulkUpload.unmatchedFiles")}
            </h3>
          </div>
          <p className="acr-body-small text-yellow-700 mb-3">
            {t("admin.bulkUpload.unmatchedDescription")}
          </p>
          <div className="flex flex-wrap gap-2">
            {unmatchedFiles.slice(0, 10).map((file, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-yellow-700 border-yellow-300"
              >
                {file.filename}
              </Badge>
            ))}
            {unmatchedFiles.length > 10 && (
              <Badge
                variant="outline"
                className="text-yellow-700 border-yellow-300"
              >
                {t("admin.bulkUpload.moreFiles").replace(
                  "{count}",
                  String(unmatchedFiles.length - 10)
                )}
              </Badge>
            )}
          </div>
        </AcrCard>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <AcrButton variant="secondary" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {t("admin.bulkUpload.back")}
        </AcrButton>
        <AcrButton
          variant="primary"
          onClick={handleUpload}
          disabled={matchedParts.length === 0}
        >
          <Upload className="h-4 w-4" />
          {t("admin.bulkUpload.startUpload")}
        </AcrButton>
      </div>
    </div>
  );
}

// Helper component for displaying a matched part
function PartRow({ part }: { part: AnalyzeResult["matchedParts"][number] }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-acr-gray-200 bg-acr-gray-50">
      <div className="flex items-center gap-3">
        <div>
          <span className="bg-acr-red-50 text-acr-red-700 px-2 py-1 rounded font-mono font-semibold acr-body-small">
            {part.acrSku}
          </span>
          <p className="acr-caption text-acr-gray-500 mt-1">{part.partType}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Product images */}
        {part.productImages.length > 0 && (
          <div className="flex items-center gap-1 acr-body-small text-acr-gray-700">
            <FileImage className="h-4 w-4 text-blue-500" />
            <span>+{part.productImages.length}</span>
          </div>
        )}

        {/* 360 frames */}
        {part.frames360.length > 0 && (
          <div className="flex items-center gap-1 acr-body-small text-acr-gray-700">
            <RotateCw className="h-4 w-4 text-green-500" />
            <span>{part.frames360.length}</span>
          </div>
        )}

        {/* Warnings */}
        {part.warnings.length > 0 && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="acr-caption text-yellow-600">
              {part.warnings.length}
            </span>
          </div>
        )}

        {/* Status */}
        {part.warnings.length === 0 && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
      </div>
    </div>
  );
}
