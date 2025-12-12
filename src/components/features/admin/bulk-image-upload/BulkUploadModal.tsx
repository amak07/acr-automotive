"use client";

import { useState, useCallback } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StageSelectFiles } from "./stages/StageSelectFiles";
import { StageReview } from "./stages/StageReview";
import { StageProgress } from "./stages/StageProgress";
import type { AnalyzeResult, ClassifiedFile } from "@/lib/bulk-upload/types";

type UploadStage = "select" | "review" | "progress";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function BulkUploadModal({
  open,
  onOpenChange,
  onComplete,
}: BulkUploadModalProps) {
  const { t } = useLocale();

  // Stage state
  const [stage, setStage] = useState<UploadStage>("select");

  // Data passed between stages
  const [classifiedFiles, setClassifiedFiles] = useState<ClassifiedFile[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(
    null
  );

  // Reset state when modal closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset all state
        setStage("select");
        setClassifiedFiles([]);
        setRawFiles([]);
        setAnalyzeResult(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Stage 1: Files selected and classified
  const handleFilesSelected = useCallback(
    (files: File[], classified: ClassifiedFile[]) => {
      setRawFiles(files);
      setClassifiedFiles(classified);
      setStage("review");
    },
    []
  );

  // Stage 2: Analysis complete, ready for upload
  const handleAnalyzeComplete = useCallback((result: AnalyzeResult) => {
    setAnalyzeResult(result);
    setStage("progress");
  }, []);

  // Stage 2: Go back to select files
  const handleBackToSelect = useCallback(() => {
    setStage("select");
  }, []);

  // Stage 3: Upload complete
  const handleUploadComplete = useCallback(() => {
    onComplete();
    handleOpenChange(false);
  }, [onComplete, handleOpenChange]);

  // Get stage title
  const getStageTitle = () => {
    switch (stage) {
      case "select":
        return t("admin.bulkUpload.modal.selectTitle");
      case "review":
        return t("admin.bulkUpload.modal.reviewTitle");
      case "progress":
        return t("admin.bulkUpload.modal.progressTitle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{getStageTitle()}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {stage === "select" && (
            <StageSelectFiles onFilesSelected={handleFilesSelected} />
          )}

          {stage === "review" && (
            <StageReview
              classifiedFiles={classifiedFiles}
              rawFiles={rawFiles}
              onAnalyzeComplete={handleAnalyzeComplete}
              onBack={handleBackToSelect}
            />
          )}

          {stage === "progress" && analyzeResult && (
            <StageProgress
              analyzeResult={analyzeResult}
              rawFiles={rawFiles}
              classifiedFiles={classifiedFiles}
              onComplete={handleUploadComplete}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
