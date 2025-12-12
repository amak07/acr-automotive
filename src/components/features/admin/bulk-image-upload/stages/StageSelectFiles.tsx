"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton, AcrCard } from "@/components/acr";
import { Upload, Folder, FileImage, RotateCw, X } from "lucide-react";
import { classifyFile } from "../utils/file-classifier";
import type { ClassifiedFile } from "@/lib/bulk-upload/types";

interface StageSelectFilesProps {
  onFilesSelected: (files: File[], classified: ClassifiedFile[]) => void;
}

export function StageSelectFiles({ onFilesSelected }: StageSelectFilesProps) {
  const { t } = useLocale();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [classifiedFiles, setClassifiedFiles] = useState<ClassifiedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Classify each file
    const classified = acceptedFiles.map((file) => classifyFile(file));
    setSelectedFiles(acceptedFiles);
    setClassifiedFiles(classified);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
    },
    multiple: true,
  });

  const handleClear = () => {
    setSelectedFiles([]);
    setClassifiedFiles([]);
  };

  const handleContinue = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles, classifiedFiles);
    }
  };

  // Count files by type
  const productCount = classifiedFiles.filter(
    (f) => f.type === "product"
  ).length;
  const frame360Count = classifiedFiles.filter(
    (f) => f.type === "360-frame"
  ).length;
  const unknownCount = classifiedFiles.filter(
    (f) => f.type === "unknown"
  ).length;
  const skippedCount = classifiedFiles.filter((f) => f.type === "skip").length;

  // Get unique SKUs
  const uniqueSkus = new Set(
    classifiedFiles.filter((f) => f.extractedSku).map((f) => f.extractedSku)
  );

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? "border-acr-red-500 bg-acr-red-50" : "border-acr-gray-300 hover:border-acr-red-300 hover:bg-acr-gray-50"}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-acr-gray-100">
            <Folder className="h-8 w-8 text-acr-gray-500" />
          </div>
          {isDragActive ? (
            <p className="acr-body text-acr-red-600 font-medium">
              {t("admin.bulkUpload.dropHere")}
            </p>
          ) : (
            <>
              <div>
                <p className="acr-body text-acr-gray-800 font-medium">
                  {t("admin.bulkUpload.dragDrop")}
                </p>
                <p className="acr-body-small text-acr-gray-500">
                  {t("admin.bulkUpload.orBrowse")}
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Product Images */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-acr-gray-50">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <FileImage className="h-4 w-4" />
              </div>
              <div>
                <p className="acr-heading-5 text-acr-gray-800">
                  {productCount}
                </p>
                <p className="acr-caption text-acr-gray-500">
                  {t("admin.bulkUpload.productImages")}
                </p>
              </div>
            </div>

            {/* 360° Frames */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-acr-gray-50">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <RotateCw className="h-4 w-4" />
              </div>
              <div>
                <p className="acr-heading-5 text-acr-gray-800">
                  {frame360Count}
                </p>
                <p className="acr-caption text-acr-gray-500">
                  {t("admin.bulkUpload.frames360")}
                </p>
              </div>
            </div>

            {/* Unknown */}
            {unknownCount > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-acr-gray-50">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <FileImage className="h-4 w-4" />
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

            {/* Unique SKUs */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-acr-gray-50">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <Folder className="h-4 w-4" />
              </div>
              <div>
                <p className="acr-heading-5 text-acr-gray-800">
                  {uniqueSkus.size}
                </p>
                <p className="acr-caption text-acr-gray-500">
                  {t("admin.bulkUpload.uniqueSkus")}
                </p>
              </div>
            </div>
          </div>

          {skippedCount > 0 && (
            <p className="mt-3 acr-body-small text-acr-gray-500">
              {t("admin.bulkUpload.filesSkipped").replace(
                "{count}",
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
          onClick={handleContinue}
          disabled={selectedFiles.length === 0}
        >
          {t("admin.bulkUpload.analyzeFiles")}
        </AcrButton>
      </div>
    </div>
  );
}
