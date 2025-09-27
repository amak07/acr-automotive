import * as React from "react";
import { cn } from "@/lib/utils";
import { AcrLabel } from "./Label";
import { AcrDirtyIndicator } from "./DirtyIndicator";

export interface AcrFormFieldProps {
  /**
   * The label text for the field
   */
  label: string;

  /**
   * Whether the field is required (shows red asterisk)
   */
  required?: boolean;

  /**
   * Whether the field has been modified (shows dirty indicator)
   */
  isDirty?: boolean;

  /**
   * Error message to display below the field
   */
  error?: string;

  /**
   * Helper text to display below the field (when no error)
   */
  helperText?: string;

  /**
   * Additional content to show next to the label (e.g., tooltips)
   */
  labelSuffix?: React.ReactNode;

  /**
   * The form input/control component
   */
  children: React.ReactNode;

  /**
   * HTML id for the form control (for label association)
   */
  htmlFor?: string;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Variant for dirty indicator
   */
  dirtyVariant?: "dot" | "badge";
}

/**
 * ACR form field wrapper component
 * Provides consistent layout and styling for form fields with labels,
 * dirty indicators, error messages, and helper text
 */
export const AcrFormField = React.forwardRef<HTMLDivElement, AcrFormFieldProps>(
  (
    {
      label,
      required,
      isDirty,
      error,
      helperText,
      labelSuffix,
      children,
      htmlFor,
      className,
      dirtyVariant = "dot",
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {/* Label with dirty indicator and suffix */}
        <AcrLabel htmlFor={htmlFor} required={required}>
          <div className="flex items-center gap-2">
            <span className="relative">
              {label}
              {labelSuffix && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2">
                  {labelSuffix}
                </div>
              )}
            </span>
            <AcrDirtyIndicator show={!!isDirty} variant={dirtyVariant} />
          </div>
        </AcrLabel>

        {/* Form control */}
        <div className="w-full">{children}</div>

        {/* Error message or helper text */}
        {(error || helperText) && (
          <p
            className={cn(
              "mt-1 acr-caption",
              hasError ? "text-red-600" : "text-acr-gray-500"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

AcrFormField.displayName = "AcrFormField";