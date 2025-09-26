import * as React from "react";
import { cn } from "@/lib/utils";

export interface AcrDirtyIndicatorProps {
  /**
   * Whether to show the dirty indicator
   */
  show: boolean;

  /**
   * Visual variant of the indicator
   * @default "dot"
   */
  variant?: "dot" | "badge";

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Badge text when using badge variant
   */
  badgeText?: string;
}

/**
 * ACR dirty field indicator component
 * Shows a visual indicator when a form field has been modified
 */
export const AcrDirtyIndicator = React.forwardRef<
  HTMLDivElement,
  AcrDirtyIndicatorProps
>(({ show, variant = "dot", className, badgeText = "Modified", ...props }, ref) => {
  if (!show) return null;

  if (variant === "badge") {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
          "bg-acr-red-100 text-acr-red-700 border border-acr-red-200",
          className
        )}
        {...props}
      >
        {badgeText}
      </div>
    );
  }

  // Default dot variant
  return (
    <div
      ref={ref}
      className={cn(
        "w-2 h-2 bg-acr-red-500 rounded-full flex-shrink-0",
        className
      )}
      {...props}
    />
  );
});

AcrDirtyIndicator.displayName = "AcrDirtyIndicator";