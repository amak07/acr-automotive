import * as React from "react";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface AcrTextareaProps extends React.ComponentProps<typeof ShadcnTextarea> {
  /**
   * Visual variant of the textarea
   * @default "default"
   */
  variant?: "default" | "disabled";
}

/**
 * ACR-branded textarea component with consistent styling
 * Built on top of shadcn Textarea with ACR design standards
 */
export const AcrTextarea = React.forwardRef<HTMLTextAreaElement, AcrTextareaProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <ShadcnTextarea
        className={cn(
          // ACR-specific styling overrides
          "pl-4 pr-4 py-3 min-h-[100px]", // ACR spacing standards
          "border-acr-gray-400 bg-white", // ACR colors
          "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent", // ACR focus states
          "transition-colors duration-200", // Smooth transitions
          "placeholder:text-acr-gray-400", // ACR placeholder color
          "resize-none", // Prevent resizing for consistency
          
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

AcrTextarea.displayName = "AcrTextarea";