import * as React from "react";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface AcrTextareaProps extends React.ComponentProps<typeof ShadcnTextarea> {
  // No variants - single consistent styling
}

/**
 * ACR-branded textarea component with consistent styling
 * Built on top of shadcn Textarea with ACR design standards
 */
export const AcrTextarea = React.forwardRef<HTMLTextAreaElement, AcrTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <ShadcnTextarea
        className={cn(
          // ACR-specific styling overrides
          "pl-4 pr-4 py-3 min-h-[100px]", // ACR spacing standards
          "transition-colors duration-200", // Smooth transitions
          "resize-none", // Prevent resizing for consistency

          // Coca-Cola chunky style - only variant
          "!border-black !border !bg-white !text-black",
          "hover:!border-gray-600 hover:!shadow-[0_0_0_2px_rgba(0,0,0,0.24)]", // Coca-Cola hover
          "focus:!outline-2 focus:!outline-black focus:!outline-offset-2 focus:!border-black focus:!ring-0",
          "!placeholder:text-acr-gray-700",
          "!px-6 !py-4", // Extra padding but keep normal radius
          "!font-medium", // Slightly bolder text

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

AcrTextarea.displayName = "AcrTextarea";