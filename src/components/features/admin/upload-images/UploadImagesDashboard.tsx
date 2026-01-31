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
  Loader2,
} from "lucide-react";
import { AcrCard, AcrButton } from "@/components/acr";
import { cn } from "@/lib/utils";

interface UploadedImage {
  filename: string;
  url: string;
  size: number;
  uploadedAt: number;
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
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
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

  const clearSession = () => {
    setImages([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-acr-gray-900 mb-2">
          {t("admin.uploadImages.title")}
        </h1>
        <p className="text-acr-gray-600">
          {t("admin.uploadImages.description")}
        </p>
      </div>

      {/* Instructions Card */}
      <AcrCard className="mb-6 p-4 bg-acr-blue-50 border-acr-blue-200">
        <h2 className="font-semibold text-acr-blue-900 mb-2">
          {t("admin.uploadImages.howItWorks")}
        </h2>
        <ol className="list-decimal list-inside text-sm text-acr-blue-800 space-y-1">
          <li>{t("admin.uploadImages.step1")}</li>
          <li>{t("admin.uploadImages.step2")}</li>
          <li>{t("admin.uploadImages.step3")}</li>
        </ol>
      </AcrCard>

      {/* Upload Zone */}
      <AcrCard className="mb-6">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragOver
              ? "border-acr-primary bg-acr-primary/5"
              : "border-acr-gray-300 hover:border-acr-gray-400"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
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
              <Loader2 className="h-12 w-12 text-acr-primary animate-spin mb-4" />
              <p className="text-acr-gray-600">
                {t("admin.uploadImages.uploading")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-acr-gray-400 mb-4" />
              <p className="text-acr-gray-700 font-medium mb-1">
                {t("admin.uploadImages.dragDrop")}
              </p>
              <p className="text-sm text-acr-gray-500">
                {t("admin.uploadImages.supportedFormats")}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </AcrCard>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <AcrCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-acr-gray-900">
              {t("admin.uploadImages.uploadedImages")} ({images.length})
            </h2>
            <AcrButton
              variant="ghost"
              size="sm"
              onClick={clearSession}
              className="text-acr-gray-500 hover:text-acr-gray-700"
            >
              {t("admin.uploadImages.clearAll")}
            </AcrButton>
          </div>

          <div className="space-y-3">
            {images.map((image) => (
              <div
                key={image.url}
                className="flex items-center gap-4 p-3 bg-acr-gray-50 rounded-lg"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 flex-shrink-0 bg-acr-gray-200 rounded overflow-hidden relative">
                  <Image
                    src={image.url}
                    alt={image.filename}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-acr-gray-900 truncate">
                    {image.filename}
                  </p>
                  <p className="text-xs text-acr-gray-500 truncate font-mono">
                    {image.url}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <AcrButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopy(image.url)}
                    className={cn(
                      "gap-1",
                      copiedUrl === image.url &&
                        "text-green-600 border-green-600"
                    )}
                  >
                    {copiedUrl === image.url ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {t("admin.uploadImages.copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        {t("admin.uploadImages.copyUrl")}
                      </>
                    )}
                  </AcrButton>
                  <AcrButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(image.url)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </AcrButton>
                </div>
              </div>
            ))}
          </div>
        </AcrCard>
      )}

      {/* Empty State */}
      {images.length === 0 && !isUploading && (
        <div className="text-center py-12 text-acr-gray-500">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-acr-gray-300" />
          <p>{t("admin.uploadImages.noImages")}</p>
        </div>
      )}
    </main>
  );
}
