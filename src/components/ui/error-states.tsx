/**
 * Centralized Error State Components
 *
 * Provides consistent error handling across the application with different
 * error state patterns for various use cases.
 */

import { ArrowLeft, AlertTriangle, Package, X } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Base error state props
interface BaseErrorProps {
  title: string;
  message: string;
  className?: string;
}

// Page-level error with navigation (like PublicPartDetails)
interface PageErrorProps extends BaseErrorProps {
  icon?: ReactNode;
  backLink?: string;
  backText?: string;
}

/**
 * Full page error state with navigation option
 * Use for: Page-level errors, 404s, failed data loads with navigation
 */
export function PageError({
  title,
  message,
  icon,
  backLink,
  backText,
  className
}: PageErrorProps) {
  const defaultIcon = <Package className="w-12 h-12 mx-auto mb-2" />;

  return (
    <div className={cn("text-center py-12", className)}>
      <div className="text-red-600 mb-2">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        {title}
      </h3>
      <p className="text-red-600 text-sm mb-4">
        {message}
      </p>
      {backLink && (
        <Link
          href={backLink as any}
          className="inline-flex items-center text-acr-blue-600 hover:text-acr-blue-800 underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {backText || "Go Back"}
        </Link>
      )}
    </div>
  );
}

/**
 * Card-contained error state for data/search errors
 * Use for: Failed API calls, search errors, data loading failures
 */
export function CardError({
  title,
  message,
  className
}: BaseErrorProps) {
  return (
    <div className={cn("bg-white p-6 rounded-lg border border-red-300 shadow-md", className)}>
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {title}
        </h3>
        <p className="text-red-600 text-sm">
          {message}
        </p>
      </div>
    </div>
  );
}

// Inline error props with optional retry
interface InlineErrorProps extends BaseErrorProps {
  onRetry?: () => void;
  retryText?: string;
}

/**
 * Compact inline error for cards and small spaces
 * Use for: Dashboard cards, form errors, compact UI elements
 */
export function InlineError({
  title,
  message,
  onRetry,
  retryText = "Try Again",
  className
}: InlineErrorProps) {
  return (
    <div className={cn("flex items-center justify-center w-full py-6", className)}>
      <div className="text-center">
        <p className="text-xs text-red-600 mb-1">
          {title}
        </p>
        <p className="text-xs text-acr-gray-500 mb-2">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-acr-blue-600 hover:text-acr-blue-800 underline"
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
}

// Toast/banner error for non-blocking notifications
interface BannerErrorProps extends BaseErrorProps {
  onDismiss?: () => void;
  dismissible?: boolean;
}

/**
 * Banner error for non-blocking notifications
 * Use for: Form validation, API errors that don't block UI
 */
export function BannerError({
  title,
  message,
  onDismiss,
  dismissible = true,
  className
}: BannerErrorProps) {
  return (
    <div className={cn(
      "bg-red-50 border border-red-300 rounded-lg p-4 mb-4",
      className
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {message}
          </p>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}