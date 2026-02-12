"use client";

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { useLocale } from "@/contexts/LocaleContext";
import {
  Upload,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Info,
  ExternalLink,
} from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { AcrSpinner } from "@/components/acr/Spinner";
import { cn } from "@/lib/utils";
import { getStaggerClass } from "@/lib/animations";

interface UploadedImage {
  filename: string;
  url: string;
  size: number;
  uploadedAt: number;
  copied?: boolean; // Track if URL was copied (visual indicator)
}

const LOCAL_STORAGE_KEY = "acr-upload-images-session";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function UploadImagesDashboard() {
  const { t } = useLocale();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setImages(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save to localStorage when images change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(images));
  }, [images]);

  const handleUpload = async (files: File[]) => {
    setError(null);
    setIsUploading(true);

    const validFiles = files.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(t("admin.uploadImages.errorInvalidType"));
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t("admin.uploadImages.errorTooLarge"));
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    validFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/admin/upload-images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("admin.uploadImages.errorUploadFailed"));
        return;
      }

      // Add uploaded images to state
      const newImages: UploadedImage[] = data.uploaded.map(
        (img: { filename: string; url: string; size: number }) => ({
          ...img,
          uploadedAt: Date.now(),
          copied: false,
        })
      );

      setImages((prev) => [...newImages, ...prev]);
    } catch {
      setError(t("admin.uploadImages.errorUploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    setDeletingUrl(url);
    try {
      const response = await fetch("/api/admin/upload-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        setImages((prev) => prev.filter((img) => img.url !== url));
      }
    } catch {
      // Silently fail - image might not exist in storage anymore
      setImages((prev) => prev.filter((img) => img.url !== url));
    } finally {
      setDeletingUrl(null);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      // Mark this image as having been copied (persistent indicator)
      setImages((prev) =>
        prev.map((img) => (img.url === url ? { ...img, copied: true } : img))
      );
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedUrl(url);
      setImages((prev) =>
        prev.map((img) => (img.url === url ? { ...img, copied: true } : img))
      );
      setTimeout(() => setCopiedUrl(null), 2000);
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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Count how many images have been copied
  const copiedCount = images.filter((img) => img.copied).length;

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with stagger animation */}
      <div className="mb-8 acr-animate-fade-up">
        <h1 className="acr-brand-heading-2xl text-acr-gray-900 mb-2">
          {t("admin.uploadImages.title")}
        </h1>
        <p className="text-acr-gray-600">{t("admin.uploadImages.description")}</p>
      </div>

      {/* Workflow Instructions Card - More prominent */}
      <AcrCard
        className={cn(
          "mb-6 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200",
          "acr-animate-fade-up acr-stagger-1"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-blue-900 mb-3 text-base">
              {t("admin.uploadImages.howItWorks")}
            </h2>
            <ol className="space-y-2">
              <li className="flex items-start gap-3 text-sm text-blue-800">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  1
                </span>
                <span>{t("admin.uploadImages.step1")}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-800">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  2
                </span>
                <span>{t("admin.uploadImages.step2")}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-800">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  3
                </span>
                <span>{t("admin.uploadImages.step3")}</span>
              </li>
            </ol>
          </div>
        </div>
      </AcrCard>

      {/* Upload Zone - Enhanced with better visual feedback */}
      <AcrCard className={cn("mb-6 p-4", "acr-animate-fade-up acr-stagger-2")}>
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 lg:p-12 text-center transition-all duration-300 cursor-pointer",
            "group",
            isDragOver
              ? "border-acr-red-400 bg-acr-red-50 scale-[1.01]"
              : "border-acr-gray-300 hover:border-acr-red-300 hover:bg-acr-gray-50"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleBrowseClick();
            }
          }}
          aria-label={t("admin.uploadImages.dragDrop")}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <AcrSpinner size="lg" color="primary" />
              <p className="text-acr-gray-600 mt-4 font-medium">
                {t("admin.uploadImages.uploading")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
                  isDragOver
                    ? "bg-acr-red-100 scale-110"
                    : "bg-acr-gray-100 group-hover:bg-acr-red-50 group-hover:scale-105"
                )}
              >
                <Upload
                  className={cn(
                    "h-8 w-8 transition-colors duration-300",
                    isDragOver
                      ? "text-acr-red-500"
                      : "text-acr-gray-400 group-hover:text-acr-red-400"
                  )}
                />
              </div>
              <p className="text-acr-gray-800 font-semibold mb-1 text-lg">
                {t("admin.uploadImages.dragDrop")}
              </p>
              <p className="text-sm text-acr-gray-500">
                {t("admin.uploadImages.supportedFormats")}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
      </AcrCard>

      {/* Uploaded Images - Enhanced with better status indicators */}
      {images.length > 0 && (
        <AcrCard className={cn("p-4 lg:p-5", "acr-animate-fade-up acr-stagger-3")}>
          {/* Header with session stats */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-acr-gray-100">
            <div>
              <h2 className="font-semibold text-acr-gray-900 text-lg">
                {t("admin.uploadImages.uploadedImages")}
              </h2>
              <p className="text-sm text-acr-gray-500 mt-0.5">
                {t("admin.uploadImages.sessionNote")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Copied counter badge */}
              {copiedCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {copiedCount}/{images.length} {t("admin.uploadImages.copiedBadge")}
                  </span>
                </div>
              )}
              {/* Total count badge */}
              <div className="px-3 py-1.5 bg-acr-gray-100 text-acr-gray-700 rounded-full text-sm font-medium">
                {images.length} {t("admin.uploadImages.imageCount")}
              </div>
            </div>
          </div>

          {/* Image grid */}
          <div className="space-y-3">
            {images.map((image, index) => (
              <div
                key={image.url}
                className={cn(
                  "flex items-center gap-4 p-3 lg:p-4 rounded-xl transition-all duration-300",
                  "border",
                  image.copied
                    ? "bg-green-50/50 border-green-200"
                    : "bg-acr-gray-50 border-transparent hover:border-acr-gray-200",
                  "acr-animate-fade-up",
                  getStaggerClass(index)
                )}
              >
                {/* Thumbnail with hover preview link */}
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 bg-acr-gray-200 rounded-lg overflow-hidden relative group/thumb"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={image.url}
                    alt={image.filename}
                    fill
                    className="object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300" />
                  </div>
                </a>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-acr-gray-900 truncate text-sm lg:text-base">
                      {image.filename}
                    </p>
                    {image.copied && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        {t("admin.uploadImages.urlCopied")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-acr-gray-500 truncate font-mono bg-acr-gray-100 px-2 py-1 rounded">
                    {image.url}
                  </p>
                </div>

                {/* Actions - Subtle, functional buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Copy URL Button - Clear but not aggressive */}
                  <button
                    onClick={() => handleCopy(image.url)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                      "transition-all duration-200",
                      copiedUrl === image.url
                        ? "bg-green-100 text-green-700"
                        : image.copied
                          ? "bg-acr-gray-100 text-acr-gray-600 hover:bg-acr-gray-200"
                          : "bg-acr-gray-100 text-acr-gray-700 hover:bg-acr-gray-200 hover:text-acr-gray-900"
                    )}
                  >
                    {copiedUrl === image.url ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>{t("admin.uploadImages.copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t("admin.uploadImages.copyUrl")}</span>
                      </>
                    )}
                  </button>

                  {/* Delete Button - Very subtle, reveals on hover */}
                  <button
                    onClick={() => handleDelete(image.url)}
                    disabled={deletingUrl === image.url}
                    className={cn(
                      "p-1.5 rounded-lg transition-all duration-200",
                      "text-acr-gray-300 hover:text-red-500 hover:bg-red-50",
                      "focus:outline-none focus:ring-2 focus:ring-red-200",
                      deletingUrl === image.url && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label={t("admin.uploadImages.deleteImage")}
                  >
                    {deletingUrl === image.url ? (
                      <AcrSpinner size="xs" color="gray" inline />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Help text at bottom */}
          <div className="mt-4 pt-4 border-t border-acr-gray-100">
            <p className="text-xs text-acr-gray-500 flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              {t("admin.uploadImages.deleteNote")}
            </p>
          </div>
        </AcrCard>
      )}

      {/* Empty State - More inviting */}
      {images.length === 0 && !isUploading && (
        <div
          className={cn(
            "text-center py-16 rounded-xl border-2 border-dashed border-acr-gray-200",
            "acr-animate-fade-up acr-stagger-3"
          )}
        >
          <div className="w-20 h-20 rounded-2xl bg-acr-gray-100 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="h-10 w-10 text-acr-gray-400" />
          </div>
          <p className="text-acr-gray-600 font-medium mb-1">
            {t("admin.uploadImages.noImages")}
          </p>
          <p className="text-sm text-acr-gray-400">
            {t("admin.uploadImages.noImagesHint")}
          </p>
        </div>
      )}
    </main>
  );
}
