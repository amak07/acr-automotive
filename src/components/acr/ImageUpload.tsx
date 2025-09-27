import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { AcrButton } from "./Button";
import { supabaseBrowser } from "@/lib/supabase/browserClient";

export interface AcrImageUploadProps {
  /**
   * Current image URL value
   */
  value?: string | null;

  /**
   * Callback when image URL changes
   */
  onValueChange: (url: string | null) => void;

  /**
   * Callback when upload starts/ends
   */
  onLoadingChange?: (loading: boolean) => void;

  /**
   * Callback for upload errors
   */
  onError?: (error: string) => void;

  /**
   * Callback for upload success
   */
  onSuccess?: (url: string) => void;

  /**
   * Maximum file size in bytes
   * @default 5MB (5 * 1024 * 1024)
   */
  maxSize?: number;

  /**
   * Accepted file types
   * @default ["image/jpeg", "image/png", "image/webp"]
   */
  acceptedTypes?: string[];

  /**
   * Supabase storage bucket name
   * @default "acr-part-images"
   */
  bucket?: string;

  /**
   * Custom className for the upload area
   */
  className?: string;

  /**
   * Height of the upload area
   * @default "h-40 lg:h-48"
   */
  height?: string;

  /**
   * Upload button text
   * @default "Select File"
   */
  buttonText?: string;

  /**
   * Placeholder text when no image
   * @default "Drop image here or click to browse"
   */
  placeholderText?: string;

  /**
   * Drag overlay text
   * @default "Drop image here..."
   */
  dragText?: string;

  /**
   * File format help text
   * @default "PNG, JPG up to 5MB"
   */
  formatText?: string;

  /**
   * Whether the upload area is disabled
   */
  disabled?: boolean;
}

/**
 * ACR image upload component with drag & drop support
 * Handles file validation, Supabase upload, and preview display
 */
export const AcrImageUpload = React.forwardRef<HTMLDivElement, AcrImageUploadProps>(
  (
    {
      value,
      onValueChange,
      onLoadingChange,
      onError,
      onSuccess,
      maxSize = 5 * 1024 * 1024, // 5MB
      acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
      bucket = "acr-part-images",
      className,
      height = "h-40 lg:h-48",
      buttonText = "Select File",
      placeholderText = "Drop image here or click to browse",
      dragText = "Drop image here...",
      formatText = "PNG, JPG up to 5MB",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleLoadingChange = (loading: boolean) => {
      setIsLoading(loading);
      onLoadingChange?.(loading);
    };

    const validateFile = (file: File): string | null => {
      if (file.size > maxSize) {
        return `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
      }

      if (!acceptedTypes.includes(file.type)) {
        return `Invalid file type. Accepted types: ${acceptedTypes.join(", ")}`;
      }

      return null;
    };

    const processFileUpload = async (file: File) => {
      if (disabled) return;

      try {
        handleLoadingChange(true);

        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        // Generate unique filename
        const fileName = `${Date.now()}-${file.name}`;

        // Upload to Supabase
        const { data: uploadData, error: uploadError } = await supabaseBrowser.storage
          .from(bucket)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = await supabaseBrowser.storage
          .from(bucket)
          .getPublicUrl(uploadData?.path ?? "");

        const newUrl = urlData.publicUrl;
        onValueChange(newUrl);
        onSuccess?.(newUrl);
      } catch (error) {
        console.error("Upload failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        onError?.(errorMessage);
      } finally {
        handleLoadingChange(false);
      }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      await processFileUpload(e.target.files[0]);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await processFileUpload(files[0]);
      }
    };

    const handleClick = () => {
      if (!disabled) {
        fileInputRef.current?.click();
      }
    };

    return (
      <div ref={ref} className="w-full" {...props}>
        {/* Upload Area */}
        <div
          className={cn(
            "w-full bg-acr-gray-50 border-2 border-dashed rounded-lg",
            "flex items-center justify-center mb-4 relative overflow-hidden",
            "transition-colors duration-200",
            height,
            // Interactive states
            !disabled && "cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed",
            // Drag states
            isDragOver && !disabled
              ? "border-acr-red-500 bg-acr-red-50"
              : "border-acr-gray-300 hover:border-black",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {/* Image Preview */}
          {value && (
            <Image
              src={value}
              fill
              style={{ objectFit: "contain" }}
              alt="Uploaded image"
            />
          )}

          {/* Placeholder Content */}
          {!value && (
            <div className="text-center px-4">
              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-acr-red-600" />
                </div>
              )}

              {/* Default State */}
              {!isLoading && (
                <>
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-acr-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-acr-gray-400" />
                  </div>
                  <p className="acr-caption lg:acr-body-small text-acr-gray-600 mb-2">
                    {isDragOver ? dragText : placeholderText}
                  </p>
                  <p className="acr-caption text-acr-gray-500">{formatText}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <AcrButton
          variant="secondary"
          size="default"
          className="w-full"
          onClick={handleClick}
          disabled={disabled || isLoading}
          type="button"
        >
          <Upload className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{buttonText}</span>
          <span className="sm:hidden">Upload</span>
        </AcrButton>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />
      </div>
    );
  }
);

AcrImageUpload.displayName = "AcrImageUpload";