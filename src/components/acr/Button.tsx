import * as React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * ACR Button variants with brand-specific styling
 */
const acrButtonVariants = cva(
  // Base styles that apply to all ACR buttons
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acr-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary ACR red button
        primary: "bg-acr-red-600 text-white shadow hover:bg-acr-red-700 active:bg-acr-red-800",
        
        // Secondary outlined button
        secondary: "border border-acr-gray-300 bg-white text-acr-gray-700 shadow-sm hover:bg-acr-gray-50 active:bg-acr-gray-100",
        
        // Destructive red button for dangerous actions
        destructive: "bg-red-600 text-white shadow hover:bg-red-700 active:bg-red-800",
        
        // Ghost button for subtle actions
        ghost: "text-acr-gray-700 hover:bg-acr-gray-100 active:bg-acr-gray-200",
        
        // Link-style button
        link: "text-acr-red-600 underline-offset-4 hover:underline hover:text-acr-red-700",
        
        // Success button
        success: "bg-green-600 text-white shadow hover:bg-green-700 active:bg-green-800",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface AcrButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof acrButtonVariants> {
  /**
   * Render as child component (for Next.js Link, etc.)
   */
  asChild?: boolean;
}

/**
 * ACR-branded button component with consistent styling
 * Built on top of shadcn Button with ACR design standards
 * 
 * @example
 * <AcrButton variant="primary">Save Changes</AcrButton>
 * <AcrButton variant="secondary" size="sm">Cancel</AcrButton>
 */
export const AcrButton = React.forwardRef<HTMLButtonElement, AcrButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <ShadcnButton
        className={cn(acrButtonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

AcrButton.displayName = "AcrButton";

export { acrButtonVariants };