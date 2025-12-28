"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Banner } from "@/types/domain/settings";
import { cn } from "@/lib/utils";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";

interface BannerCarouselProps {
  banners: Banner[];
  autoRotateInterval?: number; // milliseconds, default 3500
}

/**
 * BannerCarousel - Auto-rotating promotional banner carousel
 *
 * Features:
 * - Auto-rotates through active banners
 * - Pause on hover
 * - Manual navigation (arrows + dots)
 * - Touch/swipe support
 * - Responsive images (desktop/mobile)
 * - Optional text overlays and CTAs
 */
export function BannerCarousel({
  banners,
  autoRotateInterval = 3500,
}: BannerCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter for active banners only and sort by display_order
  const activeBanners = banners
    .filter((banner) => banner.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  // Don't render if no active banners
  if (activeBanners.length === 0) {
    return null;
  }

  // Toggle play/pause
  const toggleAutoplay = () => {
    if (!swiperRef.current) return;

    if (isPaused) {
      swiperRef.current.autoplay.start();
    } else {
      swiperRef.current.autoplay.stop();
    }
    setIsPaused(!isPaused);
  };

  return (
    <div className="relative w-full bg-white mx-auto max-w-[1560px]">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          prevEl: ".swiper-button-prev-custom",
          nextEl: ".swiper-button-next-custom",
        }}
        pagination={{
          clickable: true,
          dynamicBullets: false,
        }}
        autoplay={{
          delay: autoRotateInterval,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        speed={700}
        loop={activeBanners.length > 1}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => {
          setCurrentIndex(swiper.realIndex);
        }}
        className="banner-swiper"
      >
        {activeBanners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="w-full bg-white">
              {banner.cta_link ? (
                <Link href={banner.cta_link as Route} className="block w-full">
                  {/* Mobile Image */}
                  <Image
                    src={banner.mobile_image_url || banner.image_url}
                    alt={banner.title || "Banner"}
                    width={800}
                    height={300}
                    className="w-full h-auto md:hidden"
                    priority={currentIndex === 0}
                  />
                  {/* Desktop Image */}
                  <Image
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    width={1560}
                    height={480}
                    className="w-full h-auto hidden md:block"
                    priority={currentIndex === 0}
                  />
                </Link>
              ) : (
                <>
                  {/* Mobile Image */}
                  <Image
                    src={banner.mobile_image_url || banner.image_url}
                    alt={banner.title || "Banner"}
                    width={800}
                    height={300}
                    className="w-full h-auto md:hidden"
                    priority={currentIndex === 0}
                  />
                  {/* Desktop Image */}
                  <Image
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    width={1560}
                    height={480}
                    className="w-full h-auto hidden md:block"
                    priority={currentIndex === 0}
                  />
                </>
              )}
            </div>
          </SwiperSlide>
        ))}

        {/* Custom Navigation Arrows (desktop only, hidden on mobile) */}
        {activeBanners.length > 1 && (
          <>
            <button
              className="swiper-button-prev-custom hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-acr-gray-800 rounded-full p-3 transition-all duration-200 shadow-xl hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acr-red-600 focus-visible:ring-offset-2 z-10"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              className="swiper-button-next-custom hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-acr-gray-800 rounded-full p-3 transition-all duration-200 shadow-xl hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acr-red-600 focus-visible:ring-offset-2 z-10"
              aria-label="Next banner"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Play/Pause and Counter (bottom right, desktop only) */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-3 bg-white/90 rounded-full px-3 py-2 shadow-lg z-10">
            {/* Slide Counter */}
            <span className="text-sm font-medium text-acr-gray-800">
              {currentIndex + 1} / {activeBanners.length}
            </span>

            {/* Divider */}
            <div className="w-px h-4 bg-acr-gray-300" />

            {/* Play/Pause Button */}
            <button
              onClick={toggleAutoplay}
              className="flex items-center justify-center hover:scale-110 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acr-red-600 focus-visible:ring-offset-2 rounded-full"
              aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-acr-gray-800 fill-acr-gray-800" />
              ) : (
                <Pause className="w-4 h-4 text-acr-gray-800" />
              )}
            </button>
          </div>
        )}
      </Swiper>
    </div>
  );
}
