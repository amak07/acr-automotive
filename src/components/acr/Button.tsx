import * as React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * ACR Button variants with brand-specific styling
 */
const acrButtonVariants = cva(
  // Base styles that apply to all ACR buttons - Coca-Cola inspired modern styling
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl acr-action-text transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        // Primary ACR red button - Coca-Cola inspired with gradient and depth
        primary:
          "bg-gradient-to-b from-acr-red-500 to-acr-red-600 text-white shadow-lg hover:from-acr-red-600 hover:to-acr-red-700 hover:shadow-xl active:from-acr-red-700 active:to-acr-red-800 active:shadow-md focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",

        // Secondary outlined button - dark outline style (clean and minimal)
        secondary:
          "border-2 border-black bg-white text-black shadow-sm hover:bg-gray-200 font-medium focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",

        // Destructive red button for dangerous actions
        destructive:
          "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 hover:shadow-xl active:from-red-700 active:to-red-800 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",

        // Ghost button for subtle actions - softer interactions
        ghost:
          "text-acr-gray-700 hover:bg-acr-gray-100/80 hover:text-acr-gray-900 active:bg-acr-gray-200/80 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",

        // Link-style button - enhanced with better hover states
        link: "text-acr-red-500 underline-offset-4 hover:underline hover:text-acr-red-600 transition-colors focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:rounded-md",

        // Success button - matching gradient pattern
        success:
          "bg-gradient-to-b from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700 hover:shadow-xl active:from-green-700 active:to-green-800 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
      },
      size: {
        sm: "h-9 px-4",
        default: "h-11 px-6 py-2.5",
        lg: "h-13 px-8",
        icon: "h-11 w-11",
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
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <ShadcnButton
        className={cn(acrButtonVariants({ variant, size }), className)}
        type={type}
        ref={ref}
        {...props}
      />
    );
  }
);

AcrButton.displayName = "AcrButton";

export { acrButtonVariants };
