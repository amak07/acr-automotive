import * as React from "react";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface AcrLabelProps extends React.ComponentProps<typeof ShadcnLabel> {
  /**
   * Whether the field is required (shows red asterisk)
   */
  required?: boolean;
}

/**
 * ACR-branded label component with consistent styling
 * Built on top of shadcn Label with ACR design standards
 */
export const AcrLabel = React.forwardRef<
  React.ElementRef<typeof ShadcnLabel>,
  AcrLabelProps
>(({ className, required, children, ...props }, ref) => {
  return (
    <ShadcnLabel
      className={cn(
        // ACR-specific styling
        "block acr-body-small text-acr-gray-700 mb-2",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </ShadcnLabel>
  );
});

AcrLabel.displayName = "AcrLabel";