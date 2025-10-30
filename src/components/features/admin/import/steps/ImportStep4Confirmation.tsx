"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { CheckCircle, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { useRouter } from "next/navigation";

interface ImportResult {
  success: boolean;
  importId: string;
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalChanges: number;
  };
  executionTime: number; // in milliseconds
}

interface ImportStep4ConfirmationProps {
  isExecuting?: boolean;
  executionProgress?: {
    stage: "snapshot" | "validate" | "apply" | "history";
    message?: string;
  };
  importResult?: ImportResult | null;
  error?: string | null;
  onStartNewImport?: () => void;
  onRollback?: (importId: string) => void;
  isRollingBack?: boolean;
}

export function ImportStep4Confirmation({
  isExecuting = false,
  executionProgress,
  importResult,
  error,
  onStartNewImport,
  onRollback,
  isRollingBack = false,
}: ImportStep4ConfirmationProps) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  };

  const formatExecutionTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Executing State
  if (isExecuting) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 relative mb-6">
          <div className="absolute inset-0 border-4 border-acr-gray-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-acr-red-600 border-t-transparent rounded-full animate-spin" />
        </div>

        <h3 className="text-xl font-bold text-acr-gray-900 mb-2">
          {t("admin.import.confirm.importing")}
        </h3>

        {/* Progress Stages */}
        <div className="w-full max-w-md mt-6 space-y-3">
          <ProgressStage
            label={t("admin.import.confirm.creatingSnapshot")}
            isComplete={executionProgress ? executionProgress.stage !== "snapshot" : false}
            isCurrent={executionProgress?.stage === "snapshot"}
          />
          <ProgressStage
            label={t("admin.import.confirm.validatingData")}
            isComplete={executionProgress ? !["snapshot", "validate"].includes(executionProgress.stage) : false}
            isCurrent={executionProgress?.stage === "validate"}
          />
          <ProgressStage
            label={t("admin.import.confirm.applyingChanges")}
            isComplete={executionProgress ? executionProgress.stage === "history" : false}
            isCurrent={executionProgress?.stage === "apply"}
          />
          <ProgressStage
            label={t("admin.import.confirm.savingHistory")}
            isComplete={false}
            isCurrent={executionProgress?.stage === "history"}
          />
        </div>

        <p className="text-sm text-acr-gray-600 mt-6">
          {t("admin.import.confirm.pleaseWait")}
        </p>
        <p className="text-sm text-acr-gray-600">
          {t("admin.import.confirm.doNotClose")}
        </p>
      </div>
    );
  }

  // Parse user-friendly error messages
  const parseErrorMessage = (error: string): { title: string; message: string; suggestion: string } => {
    if (error.includes('duplicate key') && error.includes('idx_parts_sku_tenant')) {
      return {
        title: 'Duplicate Parts Detected',
        message: 'Some parts in your file already exist in the database. This usually happens when you try to import the same file twice.',
        suggestion: 'Export a fresh file from the database and make your changes to that file, or remove the duplicate parts from your current file.'
      };
    }
    if (error.includes('foreign key') || error.includes('orphaned')) {
      return {
        title: 'Data Relationship Error',
        message: 'Some records reference parts that don\'t exist in the database.',
        suggestion: 'Make sure all vehicle applications and cross-references have valid ACR_SKU values that match existing parts.'
      };
    }
    if (error.includes('null value') && error.includes('violates not-null constraint')) {
      return {
        title: 'Missing Required Data',
        message: 'Some required fields are empty in your file.',
        suggestion: 'Check that all parts have ACR_SKU and Part_Type filled in, and all vehicle applications have Make, Model, and Year information.'
      };
    }
    if (error.includes('timeout') || error.includes('ECONNRESET')) {
      return {
        title: 'Connection Timeout',
        message: 'The import took too long and the connection was lost.',
        suggestion: 'Try importing a smaller file, or check your internet connection and try again.'
      };
    }
    // Generic fallback
    return {
      title: 'Import Failed',
      message: error,
      suggestion: 'Check your file format and data, then try again. If the problem persists, contact support.'
    };
  };

  // Error State
  if (error) {
    const parsedError = parseErrorMessage(error);

    return (
      <div className="py-8">
        <AcrCard variant="outlined" className="border-red-500 bg-red-50">
          <div className="flex items-start gap-4 p-6">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                {parsedError.title}
              </h3>
              <p className="text-sm text-red-700 mb-3">
                {parsedError.message}
              </p>
              <div className="bg-red-100 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-xs font-medium text-red-900 mb-1">💡 Suggestion:</p>
                <p className="text-xs text-red-800">{parsedError.suggestion}</p>
              </div>
              <details className="mb-4">
                <summary className="text-xs text-red-700 cursor-pointer hover:text-red-900">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded border border-red-200 overflow-x-auto">
                  {error}
                </pre>
              </details>
              <div className="flex gap-3">
                <AcrButton
                  variant="secondary"
                  size="default"
                  onClick={() => router.push("/admin")}
                >
                  {t("admin.import.buttons.returnToDashboard")}
                </AcrButton>
                {onStartNewImport && (
                  <AcrButton
                    variant="primary"
                    size="default"
                    onClick={onStartNewImport}
                  >
                    Try Again
                  </AcrButton>
                )}
              </div>
            </div>
          </div>
        </AcrCard>
      </div>
    );
  }

  // Success State
  if (importResult) {
    return (
      <div className="space-y-6">
        {/* Success Banner */}
        <AcrCard variant="default" className="border-green-500 bg-green-50">
          <div className="flex items-center gap-4 p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-900">
                {t("admin.import.success.title")}
              </h2>
              <p className="text-sm text-green-700 mt-1">
                All changes have been applied successfully
              </p>
            </div>
          </div>
        </AcrCard>

        {/* Import Metadata */}
        <AcrCard variant="default" padding="default">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-acr-gray-600 mb-1">
                  {t("admin.import.success.importId")}
                </p>
                <p className="text-lg font-mono font-semibold text-acr-gray-900">
                  #{importResult.importId.slice(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-xs text-acr-gray-600 mb-1">
                  {t("admin.import.success.executionTime")}
                </p>
                <p className="text-lg font-semibold text-acr-gray-900">
                  {(importResult.executionTime / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          </div>
        </AcrCard>

        {/* Changes Summary */}
        <AcrCard variant="outlined">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-acr-gray-900 mb-4">
              {t("admin.import.success.changesApplied")}
            </h3>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  +{importResult.summary.totalAdds}
                </div>
                <div className="text-sm text-acr-gray-600 mt-2">Added</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  ~{importResult.summary.totalUpdates}
                </div>
                <div className="text-sm text-acr-gray-600 mt-2">Updated</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">
                  -{importResult.summary.totalDeletes}
                </div>
                <div className="text-sm text-acr-gray-600 mt-2">Deleted</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-acr-gray-200 text-center">
              <p className="text-sm text-acr-gray-600">
                <span className="font-semibold text-acr-gray-900">{importResult.summary.totalChanges}</span> total changes applied
              </p>
            </div>
          </div>
        </AcrCard>

        {/* Rollback Info */}
        <AcrCard variant="outlined" className="border-blue-300 bg-blue-50">
          <div className="flex items-start gap-3 p-4">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="flex-1 text-sm text-blue-900">
              <p className="font-medium mb-1">
                {t("admin.import.success.snapshotSaved")}
              </p>
              <p className="text-blue-800">
                Import #{importResult.importId.slice(0, 8)} • You can rollback this import from Settings if needed
              </p>
            </div>
          </div>
        </AcrCard>

        {/* Rollback Confirmation Dialog */}
        {showRollbackConfirm && (
          <AcrCard variant="outlined" className="border-amber-500 bg-amber-50">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <RotateCcw className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    Confirm Rollback
                  </h3>
                  <p className="text-sm text-amber-800 mb-3">
                    This will undo the import and restore the database to its state before these changes:
                  </p>
                  <div className="bg-amber-100 rounded-md p-3 mb-4 max-h-60 overflow-y-auto">
                    <div className="text-sm text-amber-900 space-y-3">
                      {importResult.summary.totalAdds > 0 && (
                        <div>
                          <p className="font-semibold mb-1">
                            ❌ {importResult.summary.totalAdds} Added {importResult.summary.totalAdds === 1 ? 'Record' : 'Records'} Will Be Removed
                          </p>
                          <p className="text-xs text-amber-800">
                            All parts, vehicle applications, and cross-references added in this import will be deleted.
                          </p>
                        </div>
                      )}
                      {importResult.summary.totalUpdates > 0 && (
                        <div>
                          <p className="font-semibold mb-1">
                            ↩️ {importResult.summary.totalUpdates} Updated {importResult.summary.totalUpdates === 1 ? 'Record' : 'Records'} Will Revert
                          </p>
                          <p className="text-xs text-amber-800">
                            All modifications to existing records will be undone, restoring previous values.
                          </p>
                        </div>
                      )}
                      {importResult.summary.totalDeletes > 0 && (
                        <div>
                          <p className="font-semibold mb-1">
                            ✅ {importResult.summary.totalDeletes} Deleted {importResult.summary.totalDeletes === 1 ? 'Record' : 'Records'} Will Be Restored
                          </p>
                          <p className="text-xs text-amber-800">
                            All records deleted during this import will be brought back with their original data.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 mb-4">
                    ⚠️ This action cannot be undone. The snapshot will be consumed and deleted.
                  </p>
                  <div className="flex gap-3">
                    <AcrButton
                      variant="secondary"
                      size="default"
                      onClick={() => setShowRollbackConfirm(false)}
                      disabled={isRollingBack}
                    >
                      Cancel
                    </AcrButton>
                    <AcrButton
                      variant="secondary"
                      size="default"
                      onClick={() => {
                        setShowRollbackConfirm(false);
                        onRollback?.(importResult.importId);
                      }}
                      disabled={isRollingBack}
                      className="bg-amber-600 text-white hover:bg-amber-700 border-amber-600"
                    >
                      {isRollingBack ? "Rolling back..." : "Yes, Rollback Import"}
                    </AcrButton>
                  </div>
                </div>
              </div>
            </div>
          </AcrCard>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center pt-4">
          <AcrButton
            variant="secondary"
            size="default"
            onClick={() => router.push("/admin")}
            disabled={isRollingBack || showRollbackConfirm}
          >
            {t("admin.import.buttons.returnToDashboard")}
          </AcrButton>
          {onRollback && !showRollbackConfirm && (
            <AcrButton
              variant="secondary"
              size="default"
              onClick={() => setShowRollbackConfirm(true)}
              disabled={isRollingBack}
              className="border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              {isRollingBack ? "Rolling back..." : "Rollback Import"}
            </AcrButton>
          )}
          {onStartNewImport && !showRollbackConfirm && (
            <AcrButton
              variant="primary"
              size="default"
              onClick={onStartNewImport}
              disabled={isRollingBack}
            >
              {t("admin.import.buttons.startNew")}
            </AcrButton>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function ProgressStage({
  label,
  isComplete,
  isCurrent,
}: {
  label: string;
  isComplete: boolean;
  isCurrent: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-acr-gray-200">
      <div className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0">
        {isComplete ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : isCurrent ? (
          <Loader2 className="w-5 h-5 text-acr-red-600 animate-spin" />
        ) : (
          <div className="w-5 h-5 border-2 border-acr-gray-300 rounded-full" />
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          isComplete
            ? "text-green-900"
            : isCurrent
            ? "text-acr-red-600"
            : "text-acr-gray-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
