import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AcrInputProps extends React.ComponentProps<typeof ShadcnInput> {
  /**
   * Visual variant of the input
   * @default "default"
   */
  variant?: "default" | "disabled";

  /**
   * Error message to display. When provided, input shows error state
   */
  error?: string;

  /**
   * Helper text to display below the input
   */
  helperText?: string;
}

/**
 * ACR-branded input component with consistent styling
 * Built on top of shadcn Input with ACR design standards
 */
export const AcrInput = React.forwardRef<HTMLInputElement, AcrInputProps>(
  ({ className, variant = "default", error, helperText, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        <ShadcnInput
          className={cn(
            // ACR-specific styling overrides
            "pl-4 pr-4 py-3 h-auto", // ACR spacing standards

            // Default border - neutral gray with hover effect
            "border-acr-gray-400 bg-white hover:border-acr-red-300",

            // Error state - red border only when there's an error
            hasError && "border-red-500 focus:border-red-500 focus:ring-red-500",

            // Focus states - only when no error
            !hasError && "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent",

            "transition-colors duration-200", // Smooth transitions
            "placeholder:text-acr-gray-400", // ACR placeholder color

            // Variant styles
            variant === "disabled" && "bg-acr-gray-50 text-acr-gray-500 cursor-not-allowed",

            className
          )}
          ref={ref}
          {...props}
        />

        {/* Helper text or error message */}
        {(error || helperText) && (
          <p className={cn(
            "mt-1 text-xs",
            hasError ? "text-red-600" : "text-acr-gray-500"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

AcrInput.displayName = "AcrInput";