"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Upload, FileSpreadsheet, CheckCircle, Loader2, AlertCircle, XCircle } from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { cn } from "@/lib/utils";

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
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPE = ".xlsx";

// Helper function to replace tokens in translation strings
const replaceTokens = (text: string, replacements: Record<string, string>): string => {
  let result = text;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, value);
  });
  return result;
};

export function ImportStep1Upload({
  onFileSelected,
  isProcessing = false,
  uploadedFile = null,
  validationResult = null,
  parseProgress,
}: ImportStep1UploadProps) {
  const { t } = useLocale();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      fileInputRef.current.value = '';
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
            error && "border-red-500 bg-red-50"
          )}
        >
          <div className="p-12 text-center">
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
            >
              <Upload className="w-4 h-4 mr-2" />
              {t("admin.import.upload.chooseFile")}
            </AcrButton>

            <p className="text-xs text-acr-gray-500 mt-4">
              {t("admin.import.upload.accepted")}
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <AcrCard variant="outlined" className="border-red-500 bg-red-50">
          <div className="flex items-start gap-3 p-4">
            <div className="w-5 h-5 text-red-600 mt-0.5">⚠️</div>
            <div className="flex-1">
              <h4 className="font-medium text-red-900">{t("admin.import.upload.error")}</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </AcrCard>
      )}

      {/* File Uploaded - Processing */}
      {uploadedFile && (
        <AcrCard variant="default" padding="default">
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
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

            {/* Parsing Progress */}
            {parseProgress?.isParsing && (
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

            {/* Validation Results */}
            {validationResult && !parseProgress?.isParsing && (
              <div className="pt-4 border-t border-acr-gray-200">
                {/* Validation Errors */}
                {validationResult.summary.totalErrors > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
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

                    {/* Show all errors - Mobile optimized */}
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {validationResult.errors.map((err, idx) => {
                        // Get user-friendly translated error message
                        let userMessage: string;

                        switch (err.code) {
                          case "E1_MISSING_HIDDEN_COLUMNS":
                            userMessage = t("admin.import.errors.e1");
                            break;
                          case "E2_DUPLICATE_ACR_SKU":
                            userMessage = replaceTokens(t("admin.import.errors.e2"), { value: String(err.value || "") });
                            break;
                          case "E3_EMPTY_REQUIRED_FIELD":
                            userMessage = replaceTokens(t("admin.import.errors.e3"), { column: String(err.column || "") });
                            break;
                          case "E4_INVALID_UUID_FORMAT":
                            userMessage = t("admin.import.errors.e4");
                            break;
                          case "E5_ORPHANED_FOREIGN_KEY":
                            userMessage = err.sheet === "Vehicle_Applications"
                              ? t("admin.import.errors.e5.vehicle")
                              : t("admin.import.errors.e5.crossref");
                            break;
                          case "E6_INVALID_YEAR_RANGE":
                            userMessage = t("admin.import.errors.e6");
                            break;
                          case "E7_STRING_EXCEEDS_MAX_LENGTH":
                            userMessage = replaceTokens(t("admin.import.errors.e7"), { column: String(err.column || "") });
                            break;
                          case "E8_YEAR_OUT_OF_RANGE":
                            userMessage = replaceTokens(t("admin.import.errors.e8"), { value: String(err.value || "") });
                            break;
                          case "E9_INVALID_NUMBER_FORMAT":
                            userMessage = replaceTokens(t("admin.import.errors.e9"), { value: String(err.value || "") });
                            break;
                          case "E10_REQUIRED_SHEET_MISSING":
                            userMessage = replaceTokens(t("admin.import.errors.e10"), { sheet: String(err.sheet || "") });
                            break;
                          case "E11_DUPLICATE_HEADER_COLUMNS":
                            userMessage = replaceTokens(t("admin.import.errors.e11"), { column: String(err.column || "") });
                            break;
                          case "E12_MISSING_REQUIRED_HEADERS":
                            userMessage = replaceTokens(t("admin.import.errors.e12"), {
                              column: String(err.column || ""),
                              sheet: String(err.sheet || "")
                            });
                            break;
                          case "E13_INVALID_SHEET_NAME":
                            userMessage = replaceTokens(t("admin.import.errors.e13"), { sheet: String(err.sheet || "") });
                            break;
                          case "E14_FILE_FORMAT_INVALID":
                            userMessage = t("admin.import.errors.e14");
                            break;
                          case "E15_FILE_SIZE_EXCEEDS_LIMIT":
                            userMessage = t("admin.import.errors.e15");
                            break;
                          case "E16_MALFORMED_EXCEL_FILE":
                            userMessage = t("admin.import.errors.e16");
                            break;
                          case "E17_ENCODING_ERROR":
                            userMessage = t("admin.import.errors.e17");
                            break;
                          case "E18_REFERENTIAL_INTEGRITY_VIOLATION":
                            userMessage = t("admin.import.errors.e18");
                            break;
                          case "E19_UUID_NOT_IN_DATABASE":
                            userMessage = replaceTokens(t("admin.import.errors.e19"), { value: String(err.value || "") });
                            break;
                          default:
                            // Fallback to original message if no translation exists
                            userMessage = err.message;
                        }

                        return (
                          <div key={idx} className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-3 sm:p-2.5 shadow-sm">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {err.row && (
                                  <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-bold">
                                    Row {err.row}
                                  </span>
                                )}
                                {err.column && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                    {err.column}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm sm:text-xs text-red-900 font-medium break-words">
                                {userMessage}
                              </p>
                              {err.value && err.code !== "E19_UUID_NOT_IN_DATABASE" && err.code !== "E2_DUPLICATE_ACR_SKU" && (
                                <p className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded font-mono break-all">
                                  Value: {String(err.value)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Upload New File Button */}
                    <div className="pt-4 border-t border-red-200">
                      <AcrButton
                        variant="secondary"
                        size="default"
                        onClick={handleBrowseClick}
                        disabled={isProcessing}
                        className="w-full sm:w-auto"
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
                    <CheckCircle className="w-6 h-6 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-sm font-semibold text-green-900">
                        {t("admin.import.upload.parsed")}
                      </p>
                      {validationResult.summary.totalWarnings > 0 && (
                        <p className="text-sm sm:text-xs text-amber-700 mt-1">
                          {validationResult.summary.totalWarnings}{" "}
                          {validationResult.summary.totalWarnings === 1 ? t("admin.import.validation.warning") : t("admin.import.validation.warnings")}
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

      {/* Instructions */}
      <AcrCard variant="outlined" className="border-blue-200 bg-blue-50">
        <div className="flex items-start gap-3 p-4">
          <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
          <div className="flex-1 text-sm text-blue-900">
            <p className="font-medium mb-1">{t("admin.import.upload.requirements")}</p>
            <ul className="space-y-1 text-blue-800">
              <li>• {t("admin.import.upload.reqFileFormat")}</li>
              <li>• {t("admin.import.upload.reqMaxSize").replace("{maxSize}", MAX_FILE_SIZE_MB.toString())}</li>
              <li>• {t("admin.import.upload.reqSheets")}</li>
              <li>• {t("admin.import.upload.reqTemplate")}</li>
            </ul>
          </div>
        </div>
      </AcrCard>
    </div>
  );
}
