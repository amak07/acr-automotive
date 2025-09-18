import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AcrInputProps extends React.ComponentProps<typeof ShadcnInput> {
  /**
   * Visual variant of the input
   * @default "default"
   */
  variant?: "default" | "disabled";
}

/**
 * ACR-branded input component with consistent styling
 * Built on top of shadcn Input with ACR design standards
 */
export const AcrInput = React.forwardRef<HTMLInputElement, AcrInputProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <ShadcnInput
        className={cn(
          // ACR-specific styling overrides
          "pl-4 pr-4 py-3 h-auto", // ACR spacing standards
          "border-acr-gray-300 bg-white", // ACR colors
          "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent", // ACR focus states
          "transition-colors duration-200", // Smooth transitions
          "placeholder:text-acr-gray-400", // ACR placeholder color
          
          // Variant styles
          variant === "disabled" && "bg-acr-gray-50 text-acr-gray-500 cursor-not-allowed",
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

AcrInput.displayName = "AcrInput";