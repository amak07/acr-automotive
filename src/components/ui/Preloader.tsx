"use client";

import { useReducer, useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";
import { AcrLogo } from "@/components/ui/AcrLogo";

interface PreloaderProps {
  /**
   * Whether the page is still loading
   */
  isLoading: boolean;
  /**
   * Minimum time to show the preloader (ms) for smooth UX
   * @default 600
   */
  minDuration?: number;
  /**
   * Path to .lottie file (dotLottie format - compressed)
   * If not provided, falls back to CSS spinner
   */
  animationSrc?: string;
}

// State machine for preloader
type PreloaderState = {
  visible: boolean;
  shouldRender: boolean;
  minTimeElapsed: boolean;
};

type PreloaderAction =
  | { type: "MIN_TIME_ELAPSED" }
  | { type: "FADE_OUT" }
  | { type: "REMOVE" };

function preloaderReducer(
  state: PreloaderState,
  action: PreloaderAction
): PreloaderState {
  switch (action.type) {
    case "MIN_TIME_ELAPSED":
      return { ...state, minTimeElapsed: true };
    case "FADE_OUT":
      return { ...state, visible: false };
    case "REMOVE":
      return { ...state, shouldRender: false };
    default:
      return state;
  }
}

/**
 * Full-page preloader component
 *
 * Shows a branded loading screen with optional Lottie animation
 * while the page content loads. Fades out smoothly when ready.
 */
export function Preloader({
  isLoading,
  minDuration = 600,
  animationSrc,
}: PreloaderProps) {
  const [state, dispatch] = useReducer(preloaderReducer, {
    visible: true,
    shouldRender: true,
    minTimeElapsed: false,
  });

  // Track minimum display time - dispatch action in timeout callback (not synchronous)
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "MIN_TIME_ELAPSED" });
    }, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  // Handle fade out when both loading complete AND min time elapsed
  useEffect(() => {
    if (!isLoading && state.minTimeElapsed && state.visible) {
      // Dispatch in microtask to avoid synchronous setState in effect
      queueMicrotask(() => dispatch({ type: "FADE_OUT" }));

      // Remove from DOM after fade-out animation completes
      const removeTimer = setTimeout(() => {
        dispatch({ type: "REMOVE" });
      }, 200);
      return () => clearTimeout(removeTimer);
    }
  }, [isLoading, state.minTimeElapsed, state.visible]);

  if (!state.shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "bg-white transition-opacity duration-200 ease-out",
        state.visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-label="Loading"
      role="progressbar"
    >
      {/* ACR Logo - negative margin compensates for SVG whitespace */}
      <AcrLogo className="h-28 md:h-32 -mb-6" />

      {/* Animation - dotLottie or fallback spinner */}
      {animationSrc ? (
        <div className="w-56 h-56 md:w-64 md:h-64">
          <DotLottieReact src={animationSrc} loop autoplay />
        </div>
      ) : (
        // Fallback: ACR-branded spinner
        <div className="w-24 h-24 md:w-28 md:h-28 relative">
          <div className="absolute inset-0 border-4 border-acr-gray-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-acr-red-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Red accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-acr-red-500" />
    </div>
  );
}
