import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AcrInputProps extends React.ComponentProps<typeof ShadcnInput> {
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
  ({ className, error, helperText, readOnly, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        <ShadcnInput
          className={cn(
            // Base input structure
            "h-auto transition-colors duration-200",

            // ACR chunky styling (Coca-Cola inspired)
            "px-6 py-4 font-medium",
            "border-black bg-white text-black placeholder:text-acr-gray-700",

            // Hover state
            "hover:border-gray-600 hover:shadow-[0_0_0_2px_rgba(0,0,0,0.24)]",

            // Focus state - normal (need !important to override shadcn base styles)
            !hasError && [
              "focus:!outline-2 focus:!outline-black focus:!outline-offset-2",
              "focus:!border-black focus:!ring-0",
              "focus-visible:!outline-2 focus-visible:!outline-black focus-visible:!outline-offset-2",
              "focus-visible:!ring-0"
            ],

            // Error state
            hasError && [
              "!border-red-600",
              "focus:!border-red-600 focus:!outline-2 focus:!outline-red-600 focus:!outline-offset-2",
              "focus-visible:!outline-2 focus-visible:!outline-red-600 focus-visible:!outline-offset-2",
              "focus-visible:!ring-0"
            ],

            // Readonly state
            readOnly && [
              "bg-acr-gray-50 text-acr-gray-700",
              "border-acr-gray-300",
              "cursor-default",
              "hover:!border-acr-gray-300 hover:!shadow-none"
            ],

            className
          )}
          ref={ref}
          readOnly={readOnly}
          {...props}
        />

        {/* Helper text or error message */}
        {(error || helperText) && (
          <p className={cn(
            "mt-1 acr-caption",
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