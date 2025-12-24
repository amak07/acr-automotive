"use client";

import { useState } from "react";
import Image from "next/image";
import { RotateCw } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Tables } from "@/lib/supabase/types";
import { Part360Viewer } from "./Part360Viewer";
import { useLocale } from "@/contexts/LocaleContext";

type PartImage = Tables<"part_images">;

type ViewMode = "360" | "photo";

interface PartImageGalleryProps {
  images: PartImage[];
  partName?: string;
  className?: string;
  /** 360° viewer frame URLs (if available) */
  viewer360Frames?: string[];
  /** Whether part has 360° viewer */
  has360Viewer?: boolean;
  /** Loading state for media */
  isLoading?: boolean;
}

// Thumbnail button component - moved outside to avoid recreation on each render
interface ThumbnailButtonProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  title?: string;
}

function ThumbnailButton({
  isSelected,
  onClick,
  children,
  ariaLabel,
  title,
}: ThumbnailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-shrink-0 overflow-hidden transition-all rounded ${
        isSelected
          ? "border-2 border-acr-red-300"
          : "border border-acr-gray-200 hover:border-acr-red-300"
      }`}
      style={{ width: "72px", height: "72px" }}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}

// 360° thumbnail content - moved outside
interface Viewer360ThumbnailProps {
  frameUrl: string | undefined;
}

function Viewer360ThumbnailContent({ frameUrl }: Viewer360ThumbnailProps) {
  return (
    <>
      {frameUrl && (
        <Image
          src={frameUrl}
          alt="360° view thumbnail"
          fill
          sizes="72px"
          style={{ objectFit: "contain" }}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <div className="flex flex-col items-center gap-0.5">
          <RotateCw className="w-5 h-5 text-white" />
          <span className="text-[9px] font-bold text-white">360°</span>
        </div>
      </div>
    </>
  );
}

// Main viewer component - moved outside
interface MainViewerProps {
  viewMode: ViewMode;
  has360Viewer: boolean;
  viewer360Frames: string[];
  partName: string;
  hasImages: boolean;
  sortedImages: PartImage[];
  photoIndex: number;
}

function MainViewerContent({
  viewMode,
  has360Viewer,
  viewer360Frames,
  partName,
  hasImages,
  sortedImages,
  photoIndex,
}: MainViewerProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {viewMode === "360" && has360Viewer && viewer360Frames.length > 0 ? (
        <Part360Viewer
          frameUrls={viewer360Frames}
          alt={`${partName} - 360° view`}
          enableFullscreen={true}
          transparent={true}
          className="w-full h-full"
        />
      ) : hasImages ? (
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={4}
          doubleClick={{ mode: "toggle", step: 1 }}
          wheel={{ disabled: true }}
          panning={{ disabled: false }}
          pinch={{ disabled: false }}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", height: "100%" }}
          >
            <div className="relative w-full h-full">
              <Image
                src={sortedImages[photoIndex]?.image_url}
                alt={
                  sortedImages[photoIndex]?.caption ||
                  `${partName} - Image ${photoIndex + 1}`
                }
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "contain" }}
                priority={photoIndex === 0 && viewMode === "photo"}
              />
            </div>
          </TransformComponent>
        </TransformWrapper>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-acr-gray-500">No image available</p>
        </div>
      )}
    </div>
  );
}

export function PartImageGallery({
  images,
  partName = "Part",
  className = "",
  viewer360Frames = [],
  has360Viewer = false,
  isLoading = false,
}: PartImageGalleryProps) {
  const { t } = useLocale();

  // Track if user has manually selected a view (null = use default)
  const [userSelectedView, setUserSelectedView] = useState<ViewMode | null>(
    null
  );
  const [photoIndex, setPhotoIndex] = useState(0);

  // Determine view mode: user selection takes priority, otherwise default to 360° if available
  const viewMode: ViewMode =
    userSelectedView !== null
      ? userSelectedView
      : has360Viewer && viewer360Frames.length > 0
        ? "360"
        : "photo";

  // Sort images by display_order (first image is primary)
  const sortedImages = [...images].sort(
    (a, b) => a.display_order - b.display_order
  );

  const hasImages = sortedImages.length > 0;
  const hasAnyMedia = has360Viewer || hasImages;

  // Handle thumbnail clicks
  const handleViewerClick = () => {
    setUserSelectedView("360");
  };

  const handlePhotoClick = (index: number) => {
    setUserSelectedView("photo");
    setPhotoIndex(index);
  };

  // Loading state - Show spinner while media loads
  if (isLoading) {
    return (
      <div className={`${className} bg-white p-4`}>
        <div className="aspect-square flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-acr-gray-200 border-t-acr-red-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-acr-gray-600">
              {t("partDetails.media.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - No images and no 360° viewer
  if (!hasAnyMedia) {
    return (
      <div
        className={`${className} bg-white flex items-center justify-center aspect-square`}
      >
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-acr-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-acr-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-acr-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  // Show thumbnails only if we have multiple media items
  const showThumbnails = (has360Viewer && hasImages) || sortedImages.length > 1;

  // Shared props for MainViewerContent
  const mainViewerProps: MainViewerProps = {
    viewMode,
    has360Viewer,
    viewer360Frames,
    partName,
    hasImages,
    sortedImages,
    photoIndex,
  };

  return (
    <div className={`${className} bg-white p-4`}>
      {/* Mobile: Column layout (main viewer on top, thumbnails below) */}
      <div className="flex flex-col gap-4 md:hidden">
        {/* Main Viewer Area */}
        <div className="relative aspect-square bg-white">
          <MainViewerContent {...mainViewerProps} />
        </div>

        {/* Bottom Thumbnails - Horizontal Strip with scroll */}
        {showThumbnails && (
          <div className="flex flex-row gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-acr-gray-300 scrollbar-track-acr-gray-100">
            {has360Viewer && (
              <ThumbnailButton
                isSelected={viewMode === "360"}
                onClick={handleViewerClick}
                ariaLabel={t("partDetails.viewer360.thumbnailAlt")}
                title={t("partDetails.viewer360.clickToView")}
              >
                <Viewer360ThumbnailContent frameUrl={viewer360Frames[0]} />
              </ThumbnailButton>
            )}
            {sortedImages.map((img, idx) => (
              <ThumbnailButton
                key={img.id}
                isSelected={viewMode === "photo" && idx === photoIndex}
                onClick={() => handlePhotoClick(idx)}
              >
                <Image
                  src={img.image_url}
                  alt={img.caption || `Thumbnail ${idx + 1}`}
                  fill
                  sizes="72px"
                  style={{ objectFit: "contain" }}
                />
              </ThumbnailButton>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Row layout (thumbnails on left, main viewer on right) */}
      <div className="hidden md:flex md:flex-row gap-4">
        {/* Left Thumbnails - Vertical Strip with scroll */}
        {showThumbnails && (
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-acr-gray-300 scrollbar-track-acr-gray-100 pr-1">
            {has360Viewer && (
              <ThumbnailButton
                isSelected={viewMode === "360"}
                onClick={handleViewerClick}
                ariaLabel={t("partDetails.viewer360.thumbnailAlt")}
                title={t("partDetails.viewer360.clickToView")}
              >
                <Viewer360ThumbnailContent frameUrl={viewer360Frames[0]} />
              </ThumbnailButton>
            )}
            {sortedImages.map((img, idx) => (
              <ThumbnailButton
                key={img.id}
                isSelected={viewMode === "photo" && idx === photoIndex}
                onClick={() => handlePhotoClick(idx)}
              >
                <Image
                  src={img.image_url}
                  alt={img.caption || `Thumbnail ${idx + 1}`}
                  fill
                  sizes="72px"
                  style={{ objectFit: "contain" }}
                />
              </ThumbnailButton>
            ))}
          </div>
        )}

        {/* Main Viewer Area */}
        <div className="flex-1 relative aspect-square bg-white">
          <MainViewerContent {...mainViewerProps} />
        </div>
      </div>
    </div>
  );
}
