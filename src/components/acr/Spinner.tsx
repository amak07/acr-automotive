import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface AcrSpinnerProps {
  /**
   * Size of the spinner
   * @default "md"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";

  /**
   * Color variant of the spinner
   * @default "primary"
   */
  color?: "primary" | "secondary" | "white" | "gray";

  /**
   * Type of spinner
   * @default "border"
   */
  type?: "border" | "icon";

  /**
   * Custom className
   */
  className?: string;

  /**
   * Whether to show inline (no centering)
   * @default false
   */
  inline?: boolean;

  /**
   * Accessibility label
   * @default "Loading..."
   */
  "aria-label"?: string;
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
} as const;

const borderColorClasses = {
  primary: "border-acr-red-600 border-t-transparent",
  secondary: "border-acr-blue-600 border-t-transparent",
  white: "border-white border-t-transparent",
  gray: "border-acr-gray-600 border-t-transparent",
} as const;

const iconColorClasses = {
  primary: "text-acr-red-600",
  secondary: "text-acr-blue-600",
  white: "text-white",
  gray: "text-acr-gray-600",
} as const;

/**
 * ACR spinner component for loading states
 * Provides consistent loading indicators across the application
 */
export const AcrSpinner = React.forwardRef<HTMLDivElement, AcrSpinnerProps>(
  (
    {
      size = "md",
      color = "primary",
      type = "border",
      className,
      inline = false,
      "aria-label": ariaLabel = "Loading...",
      ...props
    },
    ref
  ) => {
    if (type === "icon") {
      return (
        <div
          ref={ref}
          className={cn(
            "animate-spin",
            sizeClasses[size],
            iconColorClasses[color],
            !inline && "flex items-center justify-center",
            className
          )}
          role="status"
          aria-label={ariaLabel}
          {...props}
        >
          <Loader2 className="w-full h-full" />
          <span className="sr-only">{ariaLabel}</span>
        </div>
      );
    }

    // Border type spinner
    return (
      <div
        ref={ref}
        className={cn(
          "border-2 rounded-full animate-spin",
          sizeClasses[size],
          borderColorClasses[color],
          !inline && "flex items-center justify-center",
          className
        )}
        role="status"
        aria-label={ariaLabel}
        {...props}
      >
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }
);

AcrSpinner.displayName = "AcrSpinner";

// Convenience wrapper for common loading overlay
export interface AcrLoadingOverlayProps {
  /**
   * Whether the loading overlay is visible
   */
  show: boolean;

  /**
   * Custom spinner props
   */
  spinnerProps?: Omit<AcrSpinnerProps, "inline">;

  /**
   * Loading text to display below spinner
   */
  text?: string;

  /**
   * Custom className for overlay
   */
  className?: string;

  /**
   * Background opacity
   * @default "default"
   */
  opacity?: "light" | "default" | "heavy";
}

/**
 * ACR loading overlay component
 * Shows a centered spinner with optional text over content
 */
export const AcrLoadingOverlay = React.forwardRef<
  HTMLDivElement,
  AcrLoadingOverlayProps
>(
  (
    {
      show,
      spinnerProps,
      text,
      className,
      opacity = "default",
      ...props
    },
    ref
  ) => {
    if (!show) return null;

    const opacityClasses = {
      light: "bg-white/50",
      default: "bg-white/70",
      heavy: "bg-white/90",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center z-50",
          opacityClasses[opacity],
          className
        )}
        {...props}
      >
        <AcrSpinner {...spinnerProps} />
        {text && (
          <p className="mt-2 acr-body-small text-acr-gray-600">{text}</p>
        )}
      </div>
    );
  }
);

AcrLoadingOverlay.displayName = "AcrLoadingOverlay";