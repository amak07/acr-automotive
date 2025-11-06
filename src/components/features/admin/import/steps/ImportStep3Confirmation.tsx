"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { CheckCircle, Loader2, AlertCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
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

interface DiffResult {
  parts: {
    adds: any[];
    updates: any[];
    deletes: any[];
  };
  vehicleApplications: {
    adds: any[];
    updates: any[];
    deletes: any[];
  };
  crossReferences: {
    adds: any[];
    updates: any[];
    deletes: any[];
  };
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalUnchanged: number;
    totalChanges: number;
  };
}

interface ImportStep4ConfirmationProps {
  isExecuting?: boolean;
  executionProgress?: {
    stage: "snapshot" | "validate" | "apply" | "history";
    message?: string;
  };
  importResult?: ImportResult | null;
  diffResult?: DiffResult | null;
  error?: string | null;
  onStartNewImport?: () => void;
  onRollback?: (importId: string) => void;
  isRollingBack?: boolean;
}

export function ImportStep3Confirmation({
  isExecuting = false,
  executionProgress,
  importResult,
  diffResult,
  error,
  onStartNewImport,
  onRollback,
  isRollingBack = false,
}: ImportStep4ConfirmationProps) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
        title: t("admin.import.error.duplicateParts"),
        message: t("admin.import.error.duplicateDesc"),
        suggestion: t("admin.import.error.duplicateSuggestion")
      };
    }
    if (error.includes('foreign key') || error.includes('orphaned')) {
      return {
        title: t("admin.import.error.foreignKey"),
        message: t("admin.import.error.foreignKeyDesc"),
        suggestion: t("admin.import.error.foreignKeySuggestion")
      };
    }
    if (error.includes('null value') && error.includes('violates not-null constraint')) {
      return {
        title: t("admin.import.error.missingRequired"),
        message: t("admin.import.error.missingRequiredDesc"),
        suggestion: t("admin.import.error.missingRequiredSuggestion")
      };
    }
    if (error.includes('timeout') || error.includes('ECONNRESET')) {
      return {
        title: t("admin.import.error.timeout"),
        message: t("admin.import.error.timeoutDesc"),
        suggestion: t("admin.import.error.timeoutSuggestion")
      };
    }
    // Generic fallback
    return {
      title: t("admin.import.error.generic"),
      message: error,
      suggestion: t("admin.import.error.genericSuggestion")
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
                <p className="text-xs font-medium text-red-900 mb-1">💡 {t("admin.import.error.suggestionLabel")}</p>
                <p className="text-xs text-red-800">{parsedError.suggestion}</p>
              </div>
              <details className="mb-4">
                <summary className="text-xs text-red-700 cursor-pointer hover:text-red-900">
                  {t("admin.import.error.technicalDetails")}
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
                    {t("admin.import.error.tryAgain")}
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
      <div className="space-y-8">
        {/* Success Banner - Modernized */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-8 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-24 -mb-24" />

          <div className="relative flex items-center gap-5">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-1.5">
                {t("admin.import.success.title")}
              </h2>
              <p className="text-green-50 text-base">
                {t("admin.import.success.completedDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Import Metadata - Refined */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-acr-gray-50 to-white rounded-xl border border-acr-gray-200 p-5 shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-acr-gray-500 uppercase tracking-wide">
                {t("admin.import.success.importIdLabel")}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-acr-gray-900 mt-2">
              #{importResult.importId.slice(0, 8)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-acr-gray-50 to-white rounded-xl border border-acr-gray-200 p-5 shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-acr-gray-500 uppercase tracking-wide">
                {t("admin.import.success.executionTimeLabel")}
              </span>
            </div>
            <p className="text-2xl font-bold text-acr-gray-900 mt-2">
              {(importResult.executionTime / 1000).toFixed(1)}s
            </p>
          </div>
        </div>

        {/* Changes Summary - Modernized */}
        <div className="bg-white rounded-xl border border-acr-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-acr-gray-100 bg-gradient-to-r from-acr-gray-50 to-white">
            <h3 className="text-lg font-bold text-acr-gray-900">
              {t("admin.import.success.changesApplied")}
            </h3>
            <p className="text-sm text-acr-gray-600 mt-0.5">
              {t("admin.import.success.completed")}
            </p>
          </div>

          <div className="p-6">
            {/* Summary Stats - Enhanced Pills */}
            <div className="flex flex-wrap gap-3 mb-6">
              {importResult.summary.totalAdds > 0 && (
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-300 rounded-xl shadow-sm">
                  <span className="text-3xl font-black text-green-700">+{importResult.summary.totalAdds}</span>
                  <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">{t("admin.import.preview.added")}</span>
                </div>
              )}
              {importResult.summary.totalUpdates > 0 && (
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-300 rounded-xl shadow-sm">
                  <span className="text-3xl font-black text-blue-700">~{importResult.summary.totalUpdates}</span>
                  <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">{t("admin.import.preview.updated")}</span>
                </div>
              )}
              {importResult.summary.totalDeletes > 0 && (
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-300 rounded-xl shadow-sm">
                  <span className="text-3xl font-black text-red-700">-{importResult.summary.totalDeletes}</span>
                  <span className="text-sm font-semibold text-red-700 uppercase tracking-wide">{t("admin.import.preview.deleted")}</span>
                </div>
              )}
            </div>

            {/* Expandable Details */}
            {diffResult && (importResult.summary.totalAdds > 0 || importResult.summary.totalUpdates > 0 || importResult.summary.totalDeletes > 0) && (
              <div className="border-t border-acr-gray-200 pt-5">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gradient-to-r hover:from-acr-gray-50 hover:to-transparent rounded-xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-acr-gray-700 group-hover:text-acr-gray-900">
                      {showDetails ? t("admin.import.success.hideDetails") : t("admin.import.success.viewDetails")}
                    </span>
                    <span className="text-xs text-acr-gray-500 bg-acr-gray-100 px-2 py-0.5 rounded-full">
                      {(diffResult.parts.adds.length + diffResult.parts.updates.length + diffResult.parts.deletes.length).toLocaleString()} {t("admin.import.success.partsLabel")}
                    </span>
                  </div>
                  {showDetails ? (
                    <ChevronUp className="w-5 h-5 text-acr-gray-400 group-hover:text-acr-gray-600 transition-colors" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-acr-gray-400 group-hover:text-acr-gray-600 transition-colors" />
                  )}
                </button>

                {showDetails && (
                  <div className="mt-5 space-y-4">
                    {/* Added Parts */}
                    {diffResult.parts.adds.length > 0 && (
                      <div className="rounded-xl border-2 border-green-200 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-green-50 to-green-100/50 px-5 py-3 border-b-2 border-green-200">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-green-900 uppercase tracking-wide">
                              {t("admin.import.success.partsAdded")}
                            </h4>
                            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2.5 py-1 rounded-full">
                              {diffResult.parts.adds.length.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-5 max-h-64 overflow-y-auto">
                          <div className="space-y-2.5">
                            {diffResult.parts.adds.slice(0, 50).map((part: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-3 text-sm py-2 px-3 rounded-lg hover:bg-green-50/50 transition-colors">
                                <span className="text-green-600 font-bold mt-0.5">+</span>
                                <div className="flex-1 font-mono text-acr-gray-800">
                                  <span className="font-bold text-green-900">{part.after?.acr_sku || part.row?.ACR_SKU}</span>
                                  <span className="text-acr-gray-400 mx-2">•</span>
                                  <span className="text-acr-gray-700">{part.after?.part_type || part.row?.Part_Type}</span>
                                  {(part.after?.position_type || part.row?.Position_Type) && (
                                    <span className="text-acr-gray-500"> ({part.after?.position_type || part.row?.Position_Type})</span>
                                  )}
                                </div>
                              </div>
                            ))}
                            {diffResult.parts.adds.length > 50 && (
                              <div className="text-center pt-3 border-t-2 border-dashed border-green-100">
                                <p className="text-xs font-medium text-acr-gray-500">
                                  {t("admin.import.success.morePartsNotShown").replace("{count}", (diffResult.parts.adds.length - 50).toString())}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Updated Parts */}
                    {diffResult.parts.updates.length > 0 && (
                      <div className="rounded-xl border-2 border-blue-200 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-5 py-3 border-b-2 border-blue-200">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                              {t("admin.import.success.partsUpdated")}
                            </h4>
                            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2.5 py-1 rounded-full">
                              {diffResult.parts.updates.length.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-5 max-h-64 overflow-y-auto">
                          <div className="space-y-2.5">
                            {diffResult.parts.updates.slice(0, 50).map((part: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-3 text-sm py-2 px-3 rounded-lg hover:bg-blue-50/50 transition-colors">
                                <span className="text-blue-600 font-bold mt-0.5">~</span>
                                <div className="flex-1 font-mono text-acr-gray-800">
                                  <span className="font-bold text-blue-900">{part.after?.acr_sku || part.row?.ACR_SKU}</span>
                                  <span className="text-acr-gray-400 mx-2">•</span>
                                  <span className="text-acr-gray-700">{part.after?.part_type || part.row?.Part_Type}</span>
                                </div>
                              </div>
                            ))}
                            {diffResult.parts.updates.length > 50 && (
                              <div className="text-center pt-3 border-t-2 border-dashed border-blue-100">
                                <p className="text-xs font-medium text-acr-gray-500">
                                  {t("admin.import.success.morePartsNotShown").replace("{count}", (diffResult.parts.updates.length - 50).toString())}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Deleted Parts */}
                    {diffResult.parts.deletes.length > 0 && (
                      <div className="rounded-xl border-2 border-red-200 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-red-50 to-red-100/50 px-5 py-3 border-b-2 border-red-200">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-red-900 uppercase tracking-wide">
                              {t("admin.import.success.partsDeleted")}
                            </h4>
                            <span className="text-xs font-semibold text-red-700 bg-red-200 px-2.5 py-1 rounded-full">
                              {diffResult.parts.deletes.length.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-5 max-h-64 overflow-y-auto">
                          <div className="space-y-2.5">
                            {diffResult.parts.deletes.slice(0, 50).map((part: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-3 text-sm py-2 px-3 rounded-lg hover:bg-red-50/50 transition-colors">
                                <span className="text-red-600 font-bold mt-0.5">-</span>
                                <div className="flex-1 font-mono text-acr-gray-800">
                                  <span className="font-bold text-red-900">{part.before?.acr_sku || part.row?.ACR_SKU}</span>
                                  <span className="text-acr-gray-400 mx-2">•</span>
                                  <span className="text-acr-gray-700">{part.before?.part_type || part.row?.Part_Type}</span>
                                </div>
                              </div>
                            ))}
                            {diffResult.parts.deletes.length > 50 && (
                              <div className="text-center pt-3 border-t-2 border-dashed border-red-100">
                                <p className="text-xs font-medium text-acr-gray-500">
                                  {t("admin.import.success.morePartsNotShown").replace("{count}", (diffResult.parts.deletes.length - 50).toString())}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rollback Info - Refined */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-300/50 p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -mr-16 -mt-16" />

          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-blue-900 mb-1">
                {t("admin.import.success.snapshotSaved")}
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {t("admin.import.success.snapshotInfo").replace("{importId}", importResult.importId.slice(0, 8))}
              </p>
            </div>
          </div>
        </div>

        {/* Rollback Confirmation Dialog */}
        {showRollbackConfirm && (
          <AcrCard variant="outlined" className="border-amber-500 bg-amber-50">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <RotateCcw className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    {t("admin.import.rollback.confirm")}
                  </h3>
                  <p className="text-sm text-amber-800 mb-3">
                    {t("admin.import.rollback.desc")}
                  </p>
                  <div className="bg-amber-100 rounded-md p-3 mb-4 max-h-60 overflow-y-auto">
                    <div className="text-sm text-amber-900 space-y-3">
                      {importResult.summary.totalAdds > 0 && (
                        <div>
                          <p className="font-semibold mb-1">
                            ❌ {t("admin.import.rollback.addedRemoved")
                              .replace("{count}", importResult.summary.totalAdds.toString())
                              .replace("{type}", importResult.summary.totalAdds === 1 ? t("admin.import.rollback.record") : t("admin.import.rollback.records"))}
                          </p>
                          <p className="text-xs text-amber-800">
                            {t("admin.import.rollback.addedRemovedDesc")}
                          </p>
                        </div>
                      )}
                      {importResult.summary.totalUpdates > 0 && (
                        <div>
                          <p className="font-semibold mb-1">
                            ↩️ {t("admin.import.rollback.updatedReverted")
                              .replace("{count}", importResult.summary.totalUpdates.toString())
                              .replace("{type}", importResult.summary.totalUpdates === 1 ? t("admin.import.rollback.record") : t("admin.import.rollback.records"))}
                          </p>
                          <p className="text-xs text-amber-800">
                            {t("admin.import.rollback.updatedRevertedDesc")}
                          </p>
                        </div>
                      )}
                      {importResult.summary.totalDeletes > 0 && (
                        <div>
                          <p className="font-semibold mb-1">
                            ✅ {t("admin.import.rollback.deletedRestored")
                              .replace("{count}", importResult.summary.totalDeletes.toString())
                              .replace("{type}", importResult.summary.totalDeletes === 1 ? t("admin.import.rollback.record") : t("admin.import.rollback.records"))}
                          </p>
                          <p className="text-xs text-amber-800">
                            {t("admin.import.rollback.deletedRestoredDesc")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 mb-4">
                    ⚠️ {t("admin.import.rollback.warning")}
                  </p>
                  <div className="flex gap-3">
                    <AcrButton
                      variant="secondary"
                      size="default"
                      onClick={() => setShowRollbackConfirm(false)}
                      disabled={isRollingBack}
                    >
                      {t("admin.import.rollback.cancel")}
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
                      {isRollingBack ? t("admin.import.rollback.inProgress") : t("admin.import.rollback.confirm.button")}
                    </AcrButton>
                  </div>
                </div>
              </div>
            </div>
          </AcrCard>
        )}

        {/* Action Buttons - Enhanced */}
        <div className="flex gap-4 justify-center pt-6">
          <AcrButton
            variant="secondary"
            size="default"
            onClick={() => router.push("/admin")}
            disabled={isRollingBack || showRollbackConfirm}
            className="px-6 h-11 text-sm font-semibold"
          >
            {t("admin.import.buttons.returnToDashboard")}
          </AcrButton>
          {onRollback && !showRollbackConfirm && (
            <AcrButton
              variant="secondary"
              size="default"
              onClick={() => setShowRollbackConfirm(true)}
              disabled={isRollingBack}
              className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50 hover:border-amber-600 px-6 h-11 text-sm font-semibold transition-all"
            >
              {isRollingBack ? t("admin.import.rollback.inProgress") : t("admin.import.rollback.button")}
            </AcrButton>
          )}
          {onStartNewImport && !showRollbackConfirm && (
            <AcrButton
              variant="primary"
              size="default"
              onClick={onStartNewImport}
              disabled={isRollingBack}
              className="px-8 h-11 text-sm font-bold shadow-lg hover:shadow-xl transition-all"
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
