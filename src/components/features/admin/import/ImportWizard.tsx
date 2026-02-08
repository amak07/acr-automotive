"use client";

import { useState, useMemo, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Upload } from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/common/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/common/queryKeys";
import { ImportStepIndicator } from "./ImportStepIndicator";
import { ImportStep1Upload } from "./steps/ImportStep1Upload";
import { ImportStep2Validation } from "./steps/ImportStep2Validation";
import { ImportStep2DiffPreview } from "./steps/ImportStep2DiffPreview";
import { ImportStep3Confirmation } from "./steps/ImportStep3Confirmation";
import { ImportHistoryPanel } from "./ImportHistoryPanel";

// Type imports (these match the backend types)
interface ValidationResult {
  valid: boolean;
  errors: Array<{
    code: string;
    severity: "error" | "warning";
    message: string;
    sheet?: string;
    row?: number;
    column?: string;
    value?: any;
    expected?: any;
  }>;
  warnings: Array<{
    code: string;
    severity: "error" | "warning";
    message: string;
    sheet?: string;
    row?: number;
    column?: string;
    value?: any;
    expected?: any;
  }>;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    errorsBySheet: Record<string, number>;
    warningsBySheet: Record<string, number>;
  };
  parsed?: {
    parts: number;
    vehicleApplications: number;
    aliases: number;
  };
}

interface DiffResult {
  parts: any;
  vehicleApplications: any;
  crossReferences: any;
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalUnchanged: number;
    totalChanges: number;
    changesBySheet: {
      parts: number;
      vehicleApplications: number;
      crossReferences: number;
    };
  };
}

interface ImportResult {
  success: boolean;
  importId: string;
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalChanges: number;
  };
  executionTime: number;
}

interface ImportHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  rowsImported: number;
  importSummary: {
    adds: number;
    updates: number;
    deletes: number;
  } | null;
  createdAt: string;
}

interface WizardState {
  currentStep: 1 | 2 | 3;
  file: File | null;
  validationResult: ValidationResult | null;
  diffResult: DiffResult | null;
  importResult: ImportResult | null;
  warningsAcknowledged: boolean;
  isProcessing: boolean;
  isRollingBack: boolean;
  error: string | null;
  processingPhase: 'uploading' | 'validating' | 'diffing' | null;
}

export function ImportWizard() {
  const { t } = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    file: null,
    validationResult: null,
    diffResult: null,
    importResult: null,
    warningsAcknowledged: false,
    isProcessing: false,
    isRollingBack: false,
    error: null,
    processingPhase: null,
  });

  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/admin/import/history?limit=5');
        if (response.ok) {
          const data = await response.json();
          setImportHistory(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch import history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  // Determine if user can proceed to next step
  const canProceedToNext = useMemo(() => {
    switch (state.currentStep) {
      case 1:
        // Step 1 (Upload): Can proceed when file is uploaded and validated
        return state.file !== null && state.validationResult !== null && state.diffResult !== null;
      case 2:
        // Step 2 (Review): Can proceed if no errors and warnings acknowledged
        if (!state.validationResult) return false;
        if (state.validationResult.errors.length > 0) return false;
        if (state.validationResult.warnings.length > 0 && !state.warningsAcknowledged) return false;
        return state.diffResult !== null;
      case 3:
        // Step 3 (Execute): No next step
        return false;
      default:
        return false;
    }
  }, [state]);

  const handleStepClick = (step: 1 | 2 | 3) => {
    // Only allow navigation to previous completed steps
    if (step < state.currentStep) {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  };

  const handleFileSelected = async (file: File) => {
    setState((prev) => ({
      ...prev,
      file,
      isProcessing: true,
      processingPhase: 'uploading',
      error: null,
      validationResult: null,
      diffResult: null,
    }));

    try {
      // Call validation API
      const formData = new FormData();
      formData.append("file", file);

      // Transition to validating phase once upload is prepared
      setState((prev) => ({ ...prev, processingPhase: 'validating' }));

      const validationResponse = await fetch("/api/admin/import/validate", {
        method: "POST",
        body: formData,
      });

      if (!validationResponse.ok) {
        throw new Error("Validation request failed");
      }

      const validationResult: ValidationResult = await validationResponse.json();

      setState((prev) => ({
        ...prev,
        validationResult,
        isProcessing: false,
        processingPhase: 'diffing',
      }));

      // Always generate diff (even if there are errors, for preview)
      // But only advance to step 2 after diff is complete
      await handleGenerateDiff(file);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        processingPhase: null,
        error: error instanceof Error ? error.message : "Failed to validate file",
      }));
      toast({
        title: t("admin.import.toast.validationErrorTitle"),
        description: t("admin.import.toast.validationErrorDesc"),
        variant: "destructive",
      });
    }
  };

  const handleGenerateDiff = async (file: File) => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const previewResponse = await fetch("/api/admin/import/preview", {
        method: "POST",
        body: formData,
      });

      if (!previewResponse.ok) {
        throw new Error("Preview generation failed");
      }

      const previewData = await previewResponse.json();
      const diffResult: DiffResult = previewData.diff;

      setState((prev) => ({
        ...prev,
        diffResult,
        isProcessing: false,
        processingPhase: null,
        currentStep: 2, // Advance to Review step after diff is generated
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        processingPhase: null,
        error: error instanceof Error ? error.message : "Failed to generate preview",
      }));
      toast({
        title: t("admin.import.toast.previewErrorTitle"),
        description: t("admin.import.toast.previewErrorDesc"),
        variant: "destructive",
      });
    }
  };

  const handleAcknowledgeWarnings = (acknowledged: boolean) => {
    setState((prev) => ({ ...prev, warningsAcknowledged: acknowledged }));
  };

  const handleNext = async () => {
    if (state.currentStep === 2) {
      // Step 2 (Review) -> Step 3 (Execute)
      setState((prev) => ({ ...prev, currentStep: 3 }));
      // Execute import immediately when entering step 3
      await handleExecuteImport();
    } else if (canProceedToNext) {
      setState((prev) => ({ ...prev, currentStep: (prev.currentStep + 1) as any }));
    }
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      setState((prev) => ({ ...prev, currentStep: (prev.currentStep - 1) as any }));
    }
  };

  const handleCancel = () => {
    router.push("/admin");
  };

  const handleExecuteImport = async () => {
    if (!state.file) return;

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      const formData = new FormData();
      formData.append("file", state.file);

      const executeResponse = await fetch("/api/admin/import/execute", {
        method: "POST",
        body: formData,
      });

      const result = await executeResponse.json();

      if (!executeResponse.ok || !result.success) {
        // Extract error message from response
        const errorMessage = result.error || "Import execution failed";
        throw new Error(errorMessage);
      }

      const importResult: ImportResult = result;

      setState((prev) => ({
        ...prev,
        importResult,
        isProcessing: false,
      }));

      // Invalidate parts cache so dashboard refreshes
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });

      // Refresh import history
      const historyResponse = await fetch('/api/admin/import/history?limit=5');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setImportHistory(historyData.data || []);
      }

      toast({
        title: t("admin.import.toast.importSuccessTitle"),
        description: t("admin.import.toast.importSuccessDesc")
          .replace("{totalChanges}", String(importResult.summary.totalChanges))
          .replace("{adds}", String(importResult.summary.totalAdds))
          .replace("{updates}", String(importResult.summary.totalUpdates))
          .replace("{deletes}", String(importResult.summary.totalDeletes)),
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : "Failed to execute import",
      }));
      toast({
        title: t("admin.import.toast.importFailedTitle"),
        description: error instanceof Error ? error.message : t("admin.import.toast.importFailedDesc"),
        variant: "destructive",
      });
    }
  };

  const handleStartNewImport = () => {
    setState({
      currentStep: 1,
      file: null,
      validationResult: null,
      diffResult: null,
      importResult: null,
      warningsAcknowledged: false,
      isProcessing: false,
      isRollingBack: false,
      error: null,
      processingPhase: null,
    });
  };

  const handleRollback = async (importId: string) => {
    setState((prev) => ({ ...prev, isRollingBack: true, error: null }));

    try {
      const response = await fetch("/api/admin/import/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Rollback failed");
      }

      toast({
        title: t("admin.import.toast.rollbackSuccessTitle"),
        description: t("admin.import.toast.rollbackSuccessDesc")
          .replace("{parts}", String(result.restoredCounts.parts))
          .replace("{vehicleApplications}", String(result.restoredCounts.vehicleApplications))
          .replace("{crossReferences}", String(result.restoredCounts.crossReferences)),
        className: "bg-green-50 border-green-200",
      });

      // Invalidate parts cache so dashboard refreshes
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });

      // Reset wizard to initial state after successful rollback
      setState({
        currentStep: 1,
        file: null,
        validationResult: null,
        diffResult: null,
        importResult: null,
        warningsAcknowledged: false,
        isProcessing: false,
        isRollingBack: false,
        error: null,
        processingPhase: null,
      });

      // Navigate back to admin dashboard
      router.push("/admin");
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isRollingBack: false,
        error: error instanceof Error ? error.message : "Failed to rollback import",
      }));
      toast({
        title: t("admin.import.toast.rollbackFailedTitle"),
        description: error instanceof Error ? error.message : t("admin.import.toast.rollbackFailedDesc"),
        variant: "destructive",
      });
    }
  };

  const getNextButtonLabel = () => {
    switch (state.currentStep) {
      case 1:
        return t("admin.import.buttons.next");
      case 2:
        return t("admin.import.buttons.import");
      case 3:
        return t("admin.import.buttons.done");
      default:
        return t("admin.import.buttons.next");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-acr-red-50 rounded-lg flex items-center justify-center">
          <Upload className="text-acr-red-600 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-acr-gray-900">
            {t("admin.import.pageTitle")}
          </h1>
          <p className="text-sm text-acr-gray-600 mt-1">
            {t("admin.import.pageDescription")}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <ImportStepIndicator
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        isImportComplete={state.importResult !== null}
      />

      {/* Step Content */}
      <AcrCard variant="default" padding="none">
        <div className="p-6">
          {state.currentStep === 1 && (
            <ImportStep1Upload
              onFileSelected={handleFileSelected}
              isProcessing={state.isProcessing}
              uploadedFile={state.file}
              validationResult={state.validationResult}
              processingPhase={state.processingPhase}
              lastImport={importHistory[0] || null}
              parseProgress={{
                isParsing: state.isProcessing,
                rowCount: state.validationResult
                  ? {
                      parts: 0,
                      vehicleApplications: 0,
                      crossReferences: 0,
                    }
                  : undefined,
              }}
            />
          )}

          {state.currentStep === 2 && (
            <div className="space-y-6">
              {/* Show errors (blocking) if they exist */}
              {state.validationResult && state.validationResult.errors.length > 0 && (
                <ImportStep2Validation
                  validationResult={state.validationResult}
                  isValidating={false}
                  onAcknowledgeWarnings={handleAcknowledgeWarnings}
                  warningsAcknowledged={state.warningsAcknowledged}
                />
              )}

              {/* Diff Preview Section (includes cascade warnings contextually) */}
              <ImportStep2DiffPreview
                diffResult={state.diffResult}
                isGeneratingDiff={state.isProcessing}
                validationWarnings={state.validationResult?.warnings || []}
                onAcknowledgeWarnings={handleAcknowledgeWarnings}
                warningsAcknowledged={state.warningsAcknowledged}
              />
            </div>
          )}

          {state.currentStep === 3 && (
            <ImportStep3Confirmation
              isExecuting={state.isProcessing}
              importResult={state.importResult}
              diffResult={state.diffResult}
              error={state.error}
              onStartNewImport={handleStartNewImport}
              onRollback={handleRollback}
              isRollingBack={state.isRollingBack}
            />
          )}
        </div>
      </AcrCard>

      {/* Navigation Buttons - Hide on step 3 success */}
      {!(state.currentStep === 3 && state.importResult) && (
        <div className="flex justify-between">
          <AcrButton
            variant="secondary"
            onClick={state.currentStep === 1 ? handleCancel : handleBack}
            disabled={state.isProcessing}
          >
            {state.currentStep === 1 ? t("admin.import.buttons.cancel") : t("admin.import.buttons.back")}
          </AcrButton>
          <AcrButton
            variant="primary"
            onClick={handleNext}
            disabled={!canProceedToNext || state.isProcessing || state.currentStep === 3}
          >
            {state.isProcessing ? t("admin.import.processing") : getNextButtonLabel()}
          </AcrButton>
        </div>
      )}

      {/* Import History */}
      <ImportHistoryPanel
        history={importHistory}
        isLoading={isLoadingHistory}
      />
    </div>
  );
}
