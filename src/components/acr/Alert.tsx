"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, AlertCircle, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-acr-gray-50 text-acr-gray-900 border-acr-gray-200 [&>svg]:text-acr-gray-600",
        destructive: "bg-red-50 text-red-900 border-red-200 [&>svg]:text-red-600",
        success: "bg-green-50 text-green-900 border-green-200 [&>svg]:text-green-600",
        warning: "bg-yellow-50 text-yellow-900 border-yellow-200 [&>svg]:text-yellow-600",
        info: "bg-blue-50 text-blue-900 border-blue-200 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const defaultIcons = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: AlertCircle,
} as const;

export interface AcrAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Custom icon to display
   * If not provided, uses default icon for variant
   */
  icon?: LucideIcon;

  /**
   * Whether to show an icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Alert title
   */
  title?: string;

  /**
   * Alert description/content
   */
  description?: React.ReactNode;

  /**
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible?: boolean;

  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;

  /**
   * Whether the alert is visible
   * @default true
   */
  visible?: boolean;
}

/**
 * ACR alert component
 * Provides consistent styling for different types of alerts and notifications
 */
export const AcrAlert = React.forwardRef<HTMLDivElement, AcrAlertProps>(
  (
    {
      variant = "default",
      icon,
      showIcon = true,
      title,
      description,
      dismissible = false,
      onDismiss,
      visible = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(visible);
    const IconComponent = icon || defaultIcons[variant || "default"];

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && <IconComponent className="h-4 w-4" />}

        <div className="flex-1">
          {title && (
            <h5 className="mb-1 font-medium leading-none tracking-tight">
              {title}
            </h5>
          )}

          {description && (
            <div className="text-sm opacity-90">
              {description}
            </div>
          )}

          {children && !description && (
            <div className="text-sm opacity-90">
              {children}
            </div>
          )}
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Dismiss alert"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

AcrAlert.displayName = "AcrAlert";

// Convenience components for common alert types
export const AcrAlertSuccess = React.forwardRef<
  HTMLDivElement,
  Omit<AcrAlertProps, "variant">
>((props, ref) => <AcrAlert ref={ref} variant="success" {...props} />);

export const AcrAlertError = React.forwardRef<
  HTMLDivElement,
  Omit<AcrAlertProps, "variant">
>((props, ref) => <AcrAlert ref={ref} variant="destructive" {...props} />);

export const AcrAlertWarning = React.forwardRef<
  HTMLDivElement,
  Omit<AcrAlertProps, "variant">
>((props, ref) => <AcrAlert ref={ref} variant="warning" {...props} />);

export const AcrAlertInfo = React.forwardRef<
  HTMLDivElement,
  Omit<AcrAlertProps, "variant">
>((props, ref) => <AcrAlert ref={ref} variant="info" {...props} />);

AcrAlertSuccess.displayName = "AcrAlertSuccess";
AcrAlertError.displayName = "AcrAlertError";
AcrAlertWarning.displayName = "AcrAlertWarning";
AcrAlertInfo.displayName = "AcrAlertInfo";

// Enhanced toast helpers that use ACR styling
export interface AcrToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive" | "warning" | "info";
  duration?: number;
}

// Note: These would integrate with the existing useToast hook
// but provide ACR-specific styling and common patterns
export const acrToastHelpers = {
  success: (options: Omit<AcrToastOptions, "variant">) => ({
    ...options,
    variant: "success" as const,
  }),

  error: (options: Omit<AcrToastOptions, "variant">) => ({
    ...options,
    variant: "destructive" as const,
  }),

  warning: (options: Omit<AcrToastOptions, "variant">) => ({
    ...options,
    variant: "warning" as const,
  }),

  info: (options: Omit<AcrToastOptions, "variant">) => ({
    ...options,
    variant: "info" as const,
  }),
};