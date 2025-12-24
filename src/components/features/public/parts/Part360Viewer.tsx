"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";
import { AcrButton } from "@/components/acr";
import { useLocale } from "@/contexts/LocaleContext";

interface Part360ViewerProps {
  /** Array of frame URLs in sequential order (frame 0 to N) */
  frameUrls: string[];
  /** Alt text for accessibility */
  alt?: string;
  /** Enable fullscreen mode button */
  enableFullscreen?: boolean;
  /** Optional className for custom styling */
  className?: string;
  /** Remove background and rounded corners (for inline use in galleries) */
  transparent?: boolean;
}

/**
 * Interactive 360° viewer component with drag-to-rotate, touch gestures,
 * and keyboard navigation. Optimized for performance with lazy loading.
 *
 * Features:
 * - Drag to rotate (mouse)
 * - Swipe to rotate (touch)
 * - Keyboard navigation (arrow keys)
 * - Lazy loading (first 3 frames instant, rest background)
 * - Instruction hints
 * - Optional fullscreen mode
 */
export function Part360Viewer({
  frameUrls,
  alt = "360° product view",
  enableFullscreen = true,
  className = "",
  transparent = false,
}: Part360ViewerProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // State
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadedFrames, setLoadedFrames] = useState(new Set<number>([0, 1, 2]));
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Refs for drag tracking
  const dragStartX = useRef(0);
  const lastFrameOnDragStart = useRef(0);

  const totalFrames = frameUrls.length;
  const DRAG_SENSITIVITY = 3; // Pixels per frame change

  // Hide instructions after first interaction
  const hideInstructions = useCallback(() => {
    if (showInstructions) {
      setShowInstructions(false);
    }
  }, [showInstructions]);

  // Calculate frame index from drag distance
  const calculateFrameFromDrag = useCallback(
    (deltaX: number): number => {
      const frameChange = Math.floor(deltaX / DRAG_SENSITIVITY);
      let newFrame = lastFrameOnDragStart.current + frameChange;

      // Wrap around
      while (newFrame < 0) newFrame += totalFrames;
      while (newFrame >= totalFrames) newFrame -= totalFrames;

      return newFrame;
    },
    [totalFrames]
  );

  // Mouse/Touch event handlers
  const handleDragStart = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      dragStartX.current = clientX;
      lastFrameOnDragStart.current = currentFrame;
      hideInstructions();
    },
    [currentFrame, hideInstructions]
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;

      const deltaX = clientX - dragStartX.current;
      const newFrame = calculateFrameFromDrag(deltaX);

      if (newFrame !== currentFrame) {
        setCurrentFrame(newFrame);
      }
    },
    [isDragging, calculateFrameFromDrag, currentFrame]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentFrame((prev) => (prev - 1 + totalFrames) % totalFrames);
        hideInstructions();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentFrame((prev) => (prev + 1) % totalFrames);
        hideInstructions();
      }
    };

    if (containerRef.current) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [totalFrames, hideInstructions]);

  // Lazy load remaining frames in background
  useEffect(() => {
    // Preload first 3 frames immediately
    const framesToPreload = [0, 1, 2];

    framesToPreload.forEach((index) => {
      if (index < frameUrls.length) {
        const img = new Image();
        img.onload = () => {
          setLoadedFrames((prev) => new Set(prev).add(index));
        };
        img.src = frameUrls[index];
      }
    });

    // Background load remaining frames
    const remainingFrames = frameUrls.slice(3);
    remainingFrames.forEach((url, idx) => {
      const frameIndex = idx + 3;
      const img = new Image();
      img.onload = () => {
        setLoadedFrames((prev) => new Set(prev).add(frameIndex));
      };
      img.src = url;
    });
  }, [frameUrls]);

  // Fullscreen toggle - simple state-based approach (works on all browsers including iOS Safari)
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  // Loading state (first frame not loaded yet)
  const isLoading = !loadedFrames.has(0);

  // Track if we're mounted (for portal) - using useSyncExternalStore to avoid setState in effect
  const isMounted = useSyncExternalStore(
    () => () => {}, // No-op subscribe since mount state doesn't change
    () => true, // Client is always mounted
    () => false // Server is never mounted
  );

  // Fullscreen overlay rendered via portal to document.body
  const fullscreenOverlay =
    isFullscreen && isMounted
      ? createPortal(
          <div className="fixed inset-0 z-[9999] bg-black">
            <div
              className="relative h-full w-full select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
              role="img"
              aria-label={alt}
              tabIndex={0}
            >
              {/* Current frame image - using img for 360 viewer performance (dynamic src switching) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frameUrls[currentFrame]}
                alt={`${alt} - Frame ${currentFrame + 1} of ${totalFrames}`}
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />

              {/* Instruction overlay */}
              {showInstructions && (
                <div className="absolute inset-x-0 bottom-4 md:inset-0 flex items-end md:items-center justify-center pointer-events-none">
                  <div className="bg-black/60 text-white px-3 py-1.5 md:px-6 md:py-3 rounded-full backdrop-blur-sm">
                    <p className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                      <span>←</span>
                      <span>{t("partDetails.viewer360.dragToRotate")}</span>
                      <span>→</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Exit fullscreen button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/90 hover:bg-white text-acr-gray-700 hover:text-acr-gray-900 p-1.5 md:p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm border border-acr-gray-200"
                title="Exit fullscreen"
                aria-label="Exit fullscreen"
              >
                <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {/* Fullscreen mode - render via portal at document.body */}
      {fullscreenOverlay}

      {/* Normal mode - embedded in page */}
      {!isFullscreen && (
        <div
          ref={containerRef}
          className={`relative overflow-hidden flex items-center justify-center ${transparent ? "" : "bg-acr-gray-100 rounded-lg"} ${className}`}
          style={{ touchAction: "none" }}
        >
          {/* Main viewer area */}
          <div
            className="relative aspect-square w-full select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: isDragging ? "grabbing" : "grab",
            }}
            role="img"
            aria-label={alt}
            tabIndex={0}
          >
            {/* Current frame image */}
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-acr-gray-200">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-acr-gray-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-acr-gray-600">
                    {t("partDetails.viewer360.loading")}
                  </p>
                </div>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={imageRef}
                src={frameUrls[currentFrame]}
                alt={`${alt} - Frame ${currentFrame + 1} of ${totalFrames}`}
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            )}

            {/* Instruction overlay (shows initially, fades on first interaction) */}
            {showInstructions && !isLoading && (
              <div className="absolute inset-x-0 bottom-4 md:inset-0 flex items-end md:items-center justify-center pointer-events-none">
                <div className="bg-black/60 text-white px-3 py-1.5 md:px-6 md:py-3 rounded-full backdrop-blur-sm">
                  <p className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                    <span>←</span>
                    <span>{t("partDetails.viewer360.dragToRotate")}</span>
                    <span>→</span>
                  </p>
                </div>
              </div>
            )}

            {/* Fullscreen toggle (top-right) */}
            {!isLoading && enableFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/90 hover:bg-white text-acr-gray-700 hover:text-acr-gray-900 p-1.5 md:p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm border border-acr-gray-200"
                title="Enter fullscreen"
                aria-label="Enter fullscreen"
              >
                <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
