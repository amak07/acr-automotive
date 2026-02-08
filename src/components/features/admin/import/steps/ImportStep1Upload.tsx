"use client";

import { useState, useRef, useMemo, ChangeEvent, DragEvent } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  AlertCircle,
  XCircle,
  Download,
  FileDown,
  Clock,
  Package,
  Car,
  Link,
  Tag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { cn } from "@/lib/utils";
import { getStaggerClass } from "@/lib/animations";
import { exportErrorReport } from "../utils/exportErrorReport";
import type { TranslationKeys } from "@/lib/i18n/translation-keys";

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
  }>;
  warnings: Array<{
    code: string;
    severity: "error" | "warning";
    message: string;
    sheet?: string;
    row?: number;
    column?: string;
    value?: any;
  }>;
  summary: {
    totalErrors: number;
    totalWarnings: number;
  };
  parsed?: {
    parts: number;
    vehicleApplications: number;
    aliases: number;
  };
}

interface ImportStep1UploadProps {
  onFileSelected: (file: File) => void;
  isProcessing?: boolean;
  uploadedFile?: File | null;
  validationResult?: ValidationResult | null;
  parseProgress?: {
    isParsing: boolean;
    rowCount?: {
      parts: number;
      vehicleApplications: number;
      crossReferences: number;
    };
  };
  processingPhase?: "uploading" | "validating" | "diffing" | null;
  lastImport?: {
    id: string;
    fileName: string;
    importSummary: { adds: number; updates: number; deletes: number } | null;
    createdAt: string;
  } | null;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPE = ".xlsx";
const MAX_ERRORS_PER_SHEET = 5;

// Helper function to replace tokens in translation strings
const replaceTokens = (text: string, replacements: Record<string, string>): string => {
  let result = text;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, value);
  });
  return result;
};

// Helper to format a date as a relative time string (locale-aware)
const formatRelativeTime = (dateString: string, t: (key: keyof TranslationKeys) => string, locale: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("admin.import.upload.justNow");
  if (diffMins < 60) return t("admin.import.upload.minutesAgo").replace("{count}", String(diffMins));
  if (diffHours < 24) return t("admin.import.upload.hoursAgo").replace("{count}", String(diffHours));
  if (diffDays < 30) return t("admin.import.upload.daysAgo").replace("{count}", String(diffDays));

  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

export function ImportStep1Upload({
  onFileSelected,
  isProcessing = false,
  uploadedFile = null,
  validationResult = null,
  parseProgress,
  processingPhase,
  lastImport,
}: ImportStep1UploadProps) {
  const { t, locale } = useLocale();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedSheets, setExpandedSheets] = useState<Record<string, boolean>>({});
  const [expandedSheetErrors, setExpandedSheetErrors] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.name.endsWith(".xlsx")) {
      return t("admin.import.upload.errorOnlyXlsx");
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return t("admin.import.upload.errorFileSize").replace("{maxSize}", MAX_FILE_SIZE_MB.toString());
    }

    return null;
  };

  const handleFileSelection = (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelected(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadCatalog = async () => {
    setIsDownloading(true);
    try {
      window.open("/api/admin/export", "_blank");
    } finally {
      // Brief delay so button shows loading state
      setTimeout(() => setIsDownloading(false), 1500);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group errors by sheet for the grouped error display
  const errorsBySheet = useMemo(() => {
    if (!validationResult?.errors?.length) return {};
    const groups: Record<string, typeof validationResult.errors> = {};
    for (const err of validationResult.errors) {
      const sheet = err.sheet || "General";
      if (!groups[sheet]) groups[sheet] = [];
      groups[sheet].push(err);
    }
    return groups;
  }, [validationResult?.errors]);

  // Initialize expanded state: first sheet expanded by default
  const sheetNames = useMemo(() => Object.keys(errorsBySheet), [errorsBySheet]);

  const toggleSheet = (sheet: string) => {
    setExpandedSheets((prev) => ({ ...prev, [sheet]: !prev[sheet] }));
  };

  const toggleSheetErrors = (sheet: string) => {
    setExpandedSheetErrors((prev) => ({ ...prev, [sheet]: !prev[sheet] }));
  };

  const isSheetExpanded = (sheet: string, index: number) => {
    if (sheet in expandedSheets) return expandedSheets[sheet];
    return index === 0; // First sheet expanded by default
  };

  // Translate error code to user-friendly message
  const getErrorMessage = (err: (typeof validationResult extends null ? never : NonNullable<typeof validationResult>)["errors"][number]): string => {
    switch (err.code) {
      case "E1_MISSING_HIDDEN_COLUMNS":
        return t("admin.import.errors.e1");
      case "E2_DUPLICATE_ACR_SKU":
        return replaceTokens(t("admin.import.errors.e2"), { value: String(err.value || "") });
      case "E3_EMPTY_REQUIRED_FIELD":
        return replaceTokens(t("admin.import.errors.e3"), { column: String(err.column || "") });
      case "E4_INVALID_UUID_FORMAT":
        return t("admin.import.errors.e4");
      case "E5_ORPHANED_FOREIGN_KEY":
        return err.sheet === "Vehicle_Applications"
          ? t("admin.import.errors.e5.vehicle")
          : t("admin.import.errors.e5.crossref");
      case "E6_INVALID_YEAR_RANGE":
        return t("admin.import.errors.e6");
      case "E7_STRING_EXCEEDS_MAX_LENGTH":
        return replaceTokens(t("admin.import.errors.e7"), { column: String(err.column || "") });
      case "E8_YEAR_OUT_OF_RANGE":
        return replaceTokens(t("admin.import.errors.e8"), { value: String(err.value || "") });
      case "E9_INVALID_NUMBER_FORMAT":
        return replaceTokens(t("admin.import.errors.e9"), { value: String(err.value || "") });
      case "E10_REQUIRED_SHEET_MISSING":
        return replaceTokens(t("admin.import.errors.e10"), { sheet: String(err.sheet || "") });
      case "E11_DUPLICATE_HEADER_COLUMNS":
        return replaceTokens(t("admin.import.errors.e11"), { column: String(err.column || "") });
      case "E12_MISSING_REQUIRED_HEADERS":
        return replaceTokens(t("admin.import.errors.e12"), {
          column: String(err.column || ""),
          sheet: String(err.sheet || ""),
        });
      case "E13_INVALID_SHEET_NAME":
        return replaceTokens(t("admin.import.errors.e13"), { sheet: String(err.sheet || "") });
      case "E14_FILE_FORMAT_INVALID":
        return t("admin.import.errors.e14");
      case "E15_FILE_SIZE_EXCEEDS_LIMIT":
        return t("admin.import.errors.e15");
      case "E16_MALFORMED_EXCEL_FILE":
        return t("admin.import.errors.e16");
      case "E17_ENCODING_ERROR":
        return t("admin.import.errors.e17");
      case "E18_REFERENTIAL_INTEGRITY_VIOLATION":
        return t("admin.import.errors.e18");
      case "E19_UUID_NOT_IN_DATABASE":
        return replaceTokens(t("admin.import.errors.e19"), { value: String(err.value || "") });
      default:
        // Fallback to original message if no translation exists
        return err.message;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input - must always be in DOM for "Upload Corrected File" button */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPE}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="File upload"
      />

      {/* File Upload Zone */}
      {!uploadedFile && (
        <>
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-lg transition-all",
              "hover:border-acr-red-400 hover:bg-acr-red-50/50",
              isDragOver && "border-acr-red-600 bg-acr-red-50",
              !isDragOver && "border-acr-gray-300 bg-white",
              error && "border-red-500 bg-red-50",
              "acr-animate-fade-up"
            )}
          >
            <div className="p-10 sm:p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-acr-red-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-acr-red-600" />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-acr-gray-900 mb-2">
                {t("admin.import.upload.dragDrop")}
              </h3>
              <p className="text-sm text-acr-gray-600 mb-4">
                {t("admin.import.upload.orClickBrowse")}
              </p>

              <AcrButton
                variant="primary"
                size="default"
                onClick={handleBrowseClick}
                disabled={isProcessing}
                className="min-h-11"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t("admin.import.upload.chooseFile")}
              </AcrButton>

              <p className="text-xs text-acr-gray-500 mt-4">
                {t("admin.import.upload.accepted")}
              </p>
            </div>
          </div>

          {/* Download catalog + last import context */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={handleDownloadCatalog}
              disabled={isDownloading}
              className="inline-flex items-center text-xs text-acr-gray-500 hover:text-acr-red-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isDownloading
                ? t("admin.import.upload.downloadingCatalog")
                : t("admin.import.upload.downloadCatalogDesc")}
            </button>

            {lastImport && (
              <span className="text-xs text-acr-gray-500 flex items-center gap-1.5 truncate max-w-full">
                <Clock className="w-3.5 h-3.5 text-acr-gray-400 shrink-0" />
                <span className="truncate">
                  {t("admin.import.upload.lastImport")}:{" "}
                  <span className="font-medium text-acr-gray-700">
                    {lastImport.fileName}
                  </span>
                  {" \u2014 "}
                  {formatRelativeTime(lastImport.createdAt, t, locale)}
                  {lastImport.importSummary && (
                    <>
                      {" \u2014 "}
                      <span className="text-green-700">+{lastImport.importSummary.adds}</span>
                      <span className="text-acr-gray-400">/</span>
                      <span className="text-blue-700">~{lastImport.importSummary.updates}</span>
                      <span className="text-acr-gray-400">/</span>
                      <span className="text-red-700">-{lastImport.importSummary.deletes}</span>
                    </>
                  )}
                </span>
              </span>
            )}
          </div>
        </>
      )}

      {/* Error Display */}
      {error && (
        <AcrCard variant="outlined" className="border-red-500 bg-red-50">
          <div className="flex items-start gap-3 p-4">
            <div className="w-5 h-5 text-red-600 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-red-900">{t("admin.import.upload.error")}</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </AcrCard>
      )}

      {/* File Uploaded */}
      {uploadedFile && (
        <AcrCard variant="default" padding="default">
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <h4 className="font-medium text-acr-gray-900 truncate">
                    {t("admin.import.upload.fileUploaded")}
                  </h4>
                </div>
                <p className="text-sm text-acr-gray-600 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-acr-gray-500">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>

            {/* Multi-Phase Progress Indicator */}
            {isProcessing && uploadedFile && processingPhase && (
              <div className="pt-4 border-t border-acr-gray-200 space-y-2">
                <UploadProgressStage
                  label={t("admin.import.upload.phaseUploading")}
                  isComplete={
                    processingPhase === "validating" ||
                    processingPhase === "diffing"
                  }
                  isCurrent={processingPhase === "uploading"}
                />
                <UploadProgressStage
                  label={t("admin.import.upload.phaseValidating")}
                  isComplete={processingPhase === "diffing"}
                  isCurrent={processingPhase === "validating"}
                />
                <UploadProgressStage
                  label={t("admin.import.upload.phasePreview")}
                  isComplete={false}
                  isCurrent={processingPhase === "diffing"}
                />
              </div>
            )}

            {/* Fallback: old-style spinner when no processingPhase */}
            {isProcessing && uploadedFile && !processingPhase && parseProgress?.isParsing && (
              <div className="pt-4 border-t border-acr-gray-200">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-acr-red-600 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-acr-gray-900">
                      {t("admin.import.upload.parsing")}
                    </p>
                    <p className="text-xs text-acr-gray-600">
                      {t("admin.import.confirm.pleaseWait")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* File Contents Summary — shown after validation */}
            {validationResult?.parsed && !isProcessing && (
              <div className="pt-4 border-t border-acr-gray-200">
                <p className="text-xs font-medium text-acr-gray-500 uppercase tracking-wide mb-3">
                  {t("admin.import.upload.fileContents")}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div
                    className={cn(
                      "bg-acr-gray-50 rounded-lg p-3 text-center",
                      "acr-animate-fade-up",
                      getStaggerClass(0)
                    )}
                  >
                    <Package className="w-5 h-5 text-acr-gray-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-acr-gray-900">
                      {validationResult.parsed.parts.toLocaleString()}
                    </p>
                    <p className="text-xs text-acr-gray-600">
                      {t("admin.import.upload.partsRows")}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "bg-acr-gray-50 rounded-lg p-3 text-center",
                      "acr-animate-fade-up",
                      getStaggerClass(1)
                    )}
                  >
                    <Car className="w-5 h-5 text-acr-gray-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-acr-gray-900">
                      {validationResult.parsed.vehicleApplications.toLocaleString()}
                    </p>
                    <p className="text-xs text-acr-gray-600">
                      {t("admin.import.upload.vehicleAppRows")}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "bg-acr-gray-50 rounded-lg p-3 text-center",
                      "acr-animate-fade-up",
                      getStaggerClass(2)
                    )}
                  >
                    <Link className="w-5 h-5 text-acr-gray-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-acr-gray-900">
                      &mdash;
                    </p>
                    <p className="text-xs text-acr-gray-600">
                      {t("admin.import.upload.crossRefRows")}
                    </p>
                  </div>
                  {validationResult.parsed.aliases > 0 && (
                    <div
                      className={cn(
                        "bg-acr-gray-50 rounded-lg p-3 text-center",
                        "acr-animate-fade-up",
                        getStaggerClass(3)
                      )}
                    >
                      <Tag className="w-5 h-5 text-acr-gray-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-acr-gray-900">
                        {validationResult.parsed.aliases.toLocaleString()}
                      </p>
                      <p className="text-xs text-acr-gray-600">
                        {t("admin.import.upload.aliasRows")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Validation Results */}
            {validationResult && !parseProgress?.isParsing && !isProcessing && (
              <div className="pt-4 border-t border-acr-gray-200">
                {/* Validation Errors — Grouped by Sheet */}
                {validationResult.summary.totalErrors > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-base sm:text-sm font-bold text-red-900">
                          {validationResult.summary.totalErrors}{" "}
                          {validationResult.summary.totalErrors === 1
                            ? t("admin.import.upload.issueFound")
                            : t("admin.import.upload.issuesFound")}
                        </p>
                        <p className="text-sm sm:text-xs text-red-700 mt-1">
                          {t("admin.import.upload.fixIssuesPrompt")}
                        </p>
                      </div>
                    </div>

                    {/* Grouped errors by sheet */}
                    <div className="space-y-2">
                      {sheetNames.map((sheet, sheetIndex) => {
                        const sheetErrors = errorsBySheet[sheet];
                        const expanded = isSheetExpanded(sheet, sheetIndex);
                        const showAll = expandedSheetErrors[sheet] || false;
                        const visibleErrors = showAll
                          ? sheetErrors
                          : sheetErrors.slice(0, MAX_ERRORS_PER_SHEET);

                        return (
                          <div
                            key={sheet}
                            className="border border-red-200 rounded-lg overflow-hidden"
                          >
                            {/* Sheet header — toggle */}
                            <button
                              type="button"
                              onClick={() => toggleSheet(sheet)}
                              className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors text-left"
                            >
                              {expanded ? (
                                <ChevronDown className="w-4 h-4 text-red-500 shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                              <span className="text-sm font-semibold text-red-900 flex-1">
                                {sheet}
                              </span>
                              <span className="px-2 py-0.5 bg-red-200 text-red-800 rounded-full text-xs font-bold">
                                {sheetErrors.length}{" "}
                                {sheetErrors.length === 1
                                  ? t("admin.import.upload.issueFound")
                                  : t("admin.import.upload.issuesFound")}
                              </span>
                            </button>

                            {/* Sheet errors — collapsible */}
                            {expanded && (
                              <div className="p-3 space-y-2 bg-white">
                                {visibleErrors.map((err, idx) => {
                                  const userMessage = getErrorMessage(err);
                                  return (
                                    <div
                                      key={idx}
                                      className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-3 sm:p-2.5 shadow-sm"
                                    >
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {err.row && (
                                            <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-bold">
                                              {t("admin.import.upload.row")} {err.row}
                                            </span>
                                          )}
                                          {err.column && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                              {err.column}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm sm:text-xs text-red-900 font-medium wrap-break-word">
                                          {userMessage}
                                        </p>
                                        {err.value &&
                                          err.code !== "E19_UUID_NOT_IN_DATABASE" &&
                                          err.code !== "E2_DUPLICATE_ACR_SKU" && (
                                            <p className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded font-mono break-all">
                                              {t("admin.import.upload.value")}: {String(err.value)}
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Show all / show less toggle */}
                                {sheetErrors.length > MAX_ERRORS_PER_SHEET && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSheetErrors(sheet)}
                                    className="w-full text-center py-2 text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
                                  >
                                    {showAll
                                      ? t("admin.import.upload.showLessErrors")
                                      : replaceTokens(
                                          t("admin.import.upload.showAllErrors"),
                                          { count: String(sheetErrors.length) }
                                        )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons for errors */}
                    <div className="pt-4 border-t border-red-200 flex flex-col sm:flex-row gap-3">
                      <AcrButton
                        variant="secondary"
                        size="default"
                        onClick={() =>
                          exportErrorReport(
                            validationResult.errors,
                            uploadedFile?.name || "import"
                          )
                        }
                        className="w-full sm:w-auto min-h-11"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        {t("admin.import.upload.downloadErrors")}
                      </AcrButton>
                      <AcrButton
                        variant="secondary"
                        size="default"
                        onClick={handleBrowseClick}
                        disabled={isProcessing}
                        className="w-full sm:w-auto min-h-11"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {t("admin.import.upload.uploadCorrectedFile")}
                      </AcrButton>
                    </div>
                  </div>
                )}

                {/* Validation Success */}
                {validationResult.summary.totalErrors === 0 && (
                  <div className="flex items-start sm:items-center gap-3">
                    <CheckCircle className="w-6 h-6 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-sm font-semibold text-green-900">
                        {t("admin.import.upload.parsed")}
                      </p>
                      {validationResult.summary.totalWarnings > 0 && (
                        <p className="text-sm sm:text-xs text-amber-700 mt-1">
                          {validationResult.summary.totalWarnings}{" "}
                          {validationResult.summary.totalWarnings === 1
                            ? t("admin.import.validation.warning")
                            : t("admin.import.validation.warnings")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </AcrCard>
      )}
    </div>
  );
}

/**
 * Progress stage indicator for the upload/validate/preview phases.
 * Mirrors the ProgressStage pattern from ImportStep3Confirmation.
 */
function UploadProgressStage({
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
      <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0">
        {isComplete ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : isCurrent ? (
          <Loader2 className="w-5 h-5 text-acr-red-600 animate-spin" />
        ) : (
          <div className="w-5 h-5 border-2 border-acr-gray-300 rounded-full" />
        )}
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          isComplete && "text-green-900",
          isCurrent && "text-acr-red-600",
          !isComplete && !isCurrent && "text-acr-gray-600"
        )}
      >
        {label}
      </span>
    </div>
  );
}
