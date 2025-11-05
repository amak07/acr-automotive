"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Upload, FileSpreadsheet, CheckCircle, Loader2 } from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { cn } from "@/lib/utils";

interface ImportStep1UploadProps {
  onFileSelected: (file: File) => void;
  isProcessing?: boolean;
  uploadedFile?: File | null;
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

export function ImportStep1Upload({
  onFileSelected,
  isProcessing = false,
  uploadedFile = null,
  parseProgress,
}: ImportStep1UploadProps) {
  const { t } = useLocale();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.name.endsWith(".xlsx")) {
      return "Only .xlsx files are supported";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size must be less than ${MAX_FILE_SIZE_MB}MB`;
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

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPE}
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="File upload"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <AcrCard variant="outlined" className="border-red-500 bg-red-50">
          <div className="flex items-start gap-3 p-4">
            <div className="w-5 h-5 text-red-600 mt-0.5">⚠️</div>
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Upload Error</h4>
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

            {/* Parsed Results */}
            {parseProgress?.rowCount && !parseProgress.isParsing && (
              <div className="pt-4 border-t border-acr-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-900">
                    {t("admin.import.upload.parsed")}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-acr-gray-900">
                      {parseProgress.rowCount.parts.toLocaleString()}
                    </div>
                    <div className="text-xs text-acr-gray-600 mt-1">
                      {t("admin.import.preview.parts")}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-acr-gray-900">
                      {parseProgress.rowCount.vehicleApplications.toLocaleString()}
                    </div>
                    <div className="text-xs text-acr-gray-600 mt-1">
                      {t("admin.dashboard.applications")}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-acr-gray-900">
                      {parseProgress.rowCount.crossReferences.toLocaleString()}
                    </div>
                    <div className="text-xs text-acr-gray-600 mt-1">
                      {t("admin.dashboard.crossReferences")}
                    </div>
                  </div>
                </div>
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
            <p className="font-medium mb-1">Upload Requirements</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Excel format (.xlsx) only</li>
              <li>• Maximum file size: {MAX_FILE_SIZE_MB}MB</li>
              <li>• Must contain Parts, Vehicle_Applications, and Cross_References sheets</li>
              <li>• Use the export format as a template</li>
            </ul>
          </div>
        </div>
      </AcrCard>
    </div>
  );
}
