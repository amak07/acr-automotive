import * as React from "react";
import { cn } from "@/lib/utils";
import { AcrInput, AcrInputProps } from "./Input";

export interface AcrPrefixInputProps extends Omit<AcrInputProps, 'className'> {
  /**
   * Text to display as prefix (e.g., "ACR", "$", "@")
   */
  prefix: string;

  /**
   * Custom styling for the prefix
   */
  prefixClassName?: string;

  /**
   * Custom styling for the input container
   */
  containerClassName?: string;

  /**
   * Custom styling for the input itself
   */
  inputClassName?: string;
}

/**
 * ACR input component with a prefix
 * Useful for SKU inputs (ACR-123), currency inputs ($100), etc.
 */
export const AcrPrefixInput = React.forwardRef<HTMLInputElement, AcrPrefixInputProps>(
  (
    {
      prefix,
      prefixClassName,
      containerClassName,
      inputClassName,
      error,
      helperText,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        <div className={cn("relative", containerClassName)}>
          {/* Prefix */}
          <div
            className={cn(
              "absolute left-4 top-1/2 transform -translate-y-1/2",
              "text-acr-gray-600 font-medium pointer-events-none z-10",
              "select-none", // Prevent text selection
              prefixClassName
            )}
          >
            {prefix}
          </div>

          {/* Input with left padding to accommodate prefix */}
          <AcrInput
            {...props}
            ref={ref}
            className={cn(
              // Calculate left padding based on prefix length
              // Base padding of 4 (1rem) + estimated character width
              prefix.length <= 3 ? "pl-12" :
              prefix.length <= 5 ? "pl-16" :
              "pl-20",
              inputClassName
            )}
            error={error}
            helperText={helperText}
          />
        </div>
      </div>
    );
  }
);

AcrPrefixInput.displayName = "AcrPrefixInput";