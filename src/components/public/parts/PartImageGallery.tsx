"use client";

import { useState } from "react";
import Image from "next/image";
import { Tables } from "@/lib/supabase/types";

type PartImage = Tables<"part_images">;

interface PartImageGalleryProps {
  images: PartImage[];
  partName?: string;
  className?: string;
}

export function PartImageGallery({
  images,
  partName = "Part",
  className = "",
}: PartImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sort images by display_order (first image is primary)
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);

  const hasImages = sortedImages.length > 0;
  const currentImage = sortedImages[currentIndex];

  // Empty state - No images
  if (!hasImages) {
    return (
      <div className={`${className} bg-white flex items-center justify-center aspect-square`}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-acr-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-10 h-10 text-acr-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-acr-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} flex gap-4 bg-white p-4`}>
      {/* Left Thumbnails - Vertical Strip (Baleros-Bisa Style) */}
      {sortedImages.length > 1 && (
        <div className="flex flex-col gap-2 w-20 flex-shrink-0">
          {sortedImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-20 h-20 border overflow-hidden transition-all ${
                idx === currentIndex
                  ? "border-acr-gray-900 ring-2 ring-acr-gray-900"
                  : "border-acr-gray-200 hover:border-acr-gray-400"
              }`}
            >
              <Image
                src={img.image_url}
                alt={img.caption || `Thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                style={{ objectFit: "contain" }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image - Right Side (Baleros-Bisa Style) */}
      <div className="flex-1 relative aspect-square bg-white">
        <Image
          src={currentImage.image_url}
          alt={currentImage.caption || `${partName} - Image ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "contain" }}
          priority={currentIndex === 0}
          className="p-4"
        />
      </div>
    </div>
  );
}
